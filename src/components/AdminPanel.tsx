import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import supabase from "@/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Switch } from "./ui/switch";
import Header from "./Header";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Pencil } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";

interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  is_admin: boolean;
  is_active: boolean;
}

interface Resource {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  block_reason?: string;
  block_from?: string;
  block_until?: string;
}

const AdminPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'users' | 'resources'>('users');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("all");
  const [resourceSearch, setResourceSearch] = useState("");
  const [resourceStatusFilter, setResourceStatusFilter] = useState<string>("all");
  const [blockEdit, setBlockEdit] = useState<{[id: string]: {reason: string, from: string, until: string}}>({});
  const [datePickerOpen, setDatePickerOpen] = useState<{[id: string]: boolean}>({});
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");

  useEffect(() => {
    fetchUsers();
    fetchResources();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("display_name", { ascending: true });
    if (!error) setUsers(data || []);
  };

  const fetchResources = async () => {
    const { data, error } = await supabase.from("resources").select("id, name, type, is_active, block_reason, block_from, block_until");
    if (error) {
      // Sans ce retour visible, une requete refusee vidait simplement le
      // tableau, sans rien indiquer.
      console.error("Erreur lors du chargement des ressources:", error);
      toast({
        title: "Impossible de charger les ressources",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    const list = data || [];

    // Réactiver automatiquement les ressources dont la date de blocage est dépassée.
    const expiredIds = list
      .filter((r) => r.is_active === false && r.block_until && new Date(r.block_until).getTime() <= Date.now())
      .map((r) => r.id);

    if (expiredIds.length) {
      await supabase
        .from("resources")
        .update({ is_active: true, block_reason: null, block_from: null, block_until: null })
        .in("id", expiredIds);
    }

    setResources(
      list.map((r) =>
        expiredIds.includes(r.id)
          ? { ...r, is_active: true, block_reason: undefined, block_from: undefined, block_until: undefined }
          : r
      )
    );
  };

  const toggleAdminStatus = async (userId: string, isAdmin: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_admin: !isAdmin }).eq("id", userId);
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_admin: !isAdmin } : u));
      toast({ title: "Rôle administrateur mis à jour" });
    }
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_active: !isActive }).eq("id", userId);
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !isActive } : u));
      toast({ title: `Utilisateur ${!isActive ? 'activé' : 'désactivé'}` });
    }
  };

  const toggleResourceActive = async (resourceId: string, isActive: boolean) => {
    if (isActive) {
      const { error } = await supabase
        .from("resources")
        .update({ 
          is_active: true, 
          block_reason: null, 
          block_from: null, 
          block_until: null 
        })
        .eq("id", resourceId);

      if (!error) {
        setResources(resources.map(r => 
          r.id === resourceId 
            ? { ...r, is_active: true, block_reason: undefined, block_from: undefined, block_until: undefined } 
            : r
        ));
        toast({ title: `Ressource activée` });
      }
    } else {
      setBlockEdit(prev => ({
        ...prev,
        [resourceId]: { 
          reason: resources.find(r => r.id === resourceId)?.block_reason || "", 
          from: resources.find(r => r.id === resourceId)?.block_from?.slice(0, 16) || "", 
          until: resources.find(r => r.id === resourceId)?.block_until?.slice(0, 16) || "" 
        }
      }));
    }
  };

  const saveBlockInfo = async (resourceId: string) => {
    const { reason, from, until } = blockEdit[resourceId] || {};

    // Une fenetre inversee bloquerait la ressource pour toujours sans que
    // isResourceBlocked ne la considere jamais active : on refuse en amont.
    if (from && until && new Date(from).getTime() >= new Date(until).getTime()) {
      toast({
        title: "Plage invalide",
        description: "La date de début doit précéder la date de fin.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("resources").update({
      is_active: false,
      block_reason: reason,
      block_from: from ? new Date(from).toISOString() : null,
      block_until: until ? new Date(until).toISOString() : null,
    }).eq("id", resourceId);
    if (!error) {
      setResources(resources.map(r => r.id === resourceId ? { ...r, is_active: false, block_reason: reason, block_from: from, block_until: until } : r));
      setBlockEdit(prev => { const copy = { ...prev }; delete copy[resourceId]; return copy; });
      toast({ title: `Ressource désactivée` });
    }
  };

  const handleEditName = (user: User) => {
    setEditingUserId(user.id);
    setEditingName(user.display_name);
  };

  const handleSaveName = async (user: User) => {
    if (editingName.trim() && editingName !== user.display_name) {
      const { error } = await supabase.from("profiles").update({ display_name: editingName.trim() }).eq("id", user.id);
      if (!error) {
        setUsers(users.map(u => u.id === user.id ? { ...u, display_name: editingName.trim() } : u));
        toast({ title: "Nom modifié" });
      }
    }
    setEditingUserId(null);
    setEditingName("");
  };

  // Types acceptes pour un avatar. SVG volontairement exclu : un SVG peut
  // embarquer du script, et le bucket est servi en lecture publique.
  const AVATAR_MIME_AUTORISES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  const AVATAR_EXT_PAR_MIME: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const AVATAR_TAILLE_MAX = 2 * 1024 * 1024; // 2 Mo

  const handleAvatarChange = async (user: User, file: File) => {
    // On suppose que tu as un bucket 'avatars' dans Supabase Storage
    if (!AVATAR_MIME_AUTORISES.includes(file.type)) {
      toast({
        title: "Format non accepte",
        description: "Choisissez une image PNG, JPEG, WebP ou GIF.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > AVATAR_TAILLE_MAX) {
      toast({
        title: "Fichier trop volumineux",
        description: `${(file.size / 1024 / 1024).toFixed(1)} Mo pour un maximum de 2 Mo.`,
        variant: "destructive",
      });
      return;
    }

    // L'extension est deduite du type MIME, jamais du nom fourni par le
    // client : un nom de fichier est une donnee non fiable.
    const fileExt = AVATAR_EXT_PAR_MIME[file.type];
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
    if (error) {
      toast({ title: "Erreur lors de l'upload de l'avatar", description: error.message, variant: "destructive" });
      return;
    }
    const publicUrl = supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
    const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
    if (!updateError) {
      setUsers(users.map(u => u.id === user.id ? { ...u, avatar_url: publicUrl } : u));
      toast({ title: "Photo de profil modifiée" });
    }
  };

  /** Resume lisible de la fenetre de blocage pour la colonne du tableau. */
  const formatPlageBlocage = (resource: Resource): string => {
    const fmt = (d: string) => format(new Date(d), "yyyy-MM-dd HH:mm");
    const { block_from: debut, block_until: fin } = resource;
    if (debut && fin) return `${fmt(debut)} → ${fmt(fin)}`;
    if (fin) return `jusqu'au ${fmt(fin)}`;
    if (debut) return `à partir du ${fmt(debut)}`;
    return "-";
  };

  /** Selecteur d'une des deux bornes de la fenetre de blocage. */
  const renderSelecteurDate = (
    resourceId: string,
    borne: "from" | "until",
    libelle: string
  ) => {
    const cle = `${resourceId}:${borne}`;
    const valeur = blockEdit[resourceId]?.[borne];
    return (
      <div className="flex items-center gap-1">
        <Popover
          open={datePickerOpen[cle]}
          onOpenChange={open => setDatePickerOpen(prev => ({ ...prev, [cle]: open }))}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
              onClick={() => setDatePickerOpen(prev => ({ ...prev, [cle]: true }))}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {valeur ? format(new Date(valeur), "yyyy-MM-dd HH:mm") : libelle}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={valeur ? new Date(valeur) : undefined}
              onSelect={date => {
                if (date) {
                  const iso = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16);
                  setBlockEdit(prev => ({
                    ...prev,
                    [resourceId]: { ...prev[resourceId], [borne]: iso },
                  }));
                  setDatePickerOpen(prev => ({ ...prev, [cle]: false }));
                }
              }}
              className="rounded-md border"
            />
          </PopoverContent>
        </Popover>
        {valeur && (
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Effacer ${libelle.toLowerCase()}`}
            onClick={() =>
              setBlockEdit(prev => ({
                ...prev,
                [resourceId]: { ...prev[resourceId], [borne]: "" },
              }))
            }
          >
            ✕
          </Button>
        )}
      </div>
    );
  };

  const filteredUsers = users.filter(
    (user) =>
      user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col grow gap-2 bg-background">
      <Header />
      <div className="container mx-auto p-6">
        <div className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex gap-4 mb-8">
            <Button 
              variant={activeTab === 'users' ? 'default' : 'outline'} 
              onClick={() => setActiveTab('users')}
            >
              Gestion des utilisateurs
            </Button>
            <Button 
              variant={activeTab === 'resources' ? 'default' : 'outline'} 
              onClick={() => setActiveTab('resources')}
            >
              Gestion des ressources
            </Button>
          </div>

          {activeTab === 'users' && (
            <>
              <h1 className="text-2xl font-bold mb-6">
                Gestion des administrateurs
              </h1>
              <div className="mb-6">
                <Input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Table className="mb-10">
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead className="text-right">Administrateur</TableHead>
                    <TableHead className="text-right">Actif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="flex items-center gap-2">
                        <div className="relative group">
                          <img
                            src={user.avatar_url || "/lio2.png"}
                            alt={user.display_name}
                            className="w-8 h-8 rounded-full object-cover border"
                          />
                          <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 cursor-pointer shadow group-hover:opacity-100 opacity-0 transition-opacity" title="Modifier la photo">
                            <Pencil className="w-4 h-4 text-gray-600" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => {
                                if (e.target.files && e.target.files[0]) handleAvatarChange(user, e.target.files[0]);
                              }}
                            />
                          </label>
                        </div>
                        {editingUserId === user.id ? (
                          <Input
                            value={editingName}
                            autoFocus
                            className="w-40"
                            onChange={e => setEditingName(e.target.value)}
                            onBlur={() => handleSaveName(user)}
                            onKeyDown={e => {
                              if (e.key === "Enter") handleSaveName(user);
                              if (e.key === "Escape") { setEditingUserId(null); setEditingName(""); }
                            }}
                          />
                        ) : (
                          <span className="cursor-pointer hover:underline" onClick={() => handleEditName(user)}>{user.display_name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={user.is_admin}
                          onCheckedChange={() => toggleAdminStatus(user.id, user.is_admin)}
                          disabled={user.id === currentUser?.id}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={user.is_active}
                          onCheckedChange={() => toggleUserActive(user.id, user.is_active)}
                          disabled={user.id === currentUser?.id}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}

          {activeTab === 'resources' && (
            <>
              <h2 className="text-2xl font-bold mb-6">
                Gestion des ressources
              </h2>
              <div className="mb-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex gap-2 items-center">
                  <label htmlFor="resourceTypeFilter">Type :</label>
                  <select
                    id="resourceTypeFilter"
                    value={resourceTypeFilter}
                    onChange={e => setResourceTypeFilter(e.target.value)}
                    className="border rounded px-2 py-1 bg-background"
                  >
                    <option value="all">Tous</option>
                    <option value="desk">Bureaux</option>
                    <option value="room">Salles</option>
                    <option value="slot">Parking</option>
                    <option value="baby">Baby</option>
                  </select>
                </div>
                <div className="flex gap-2 items-center">
                  <label htmlFor="resourceStatusFilter">État :</label>
                  <select
                    id="resourceStatusFilter"
                    value={resourceStatusFilter}
                    onChange={e => setResourceStatusFilter(e.target.value)}
                    className="border rounded px-2 py-1 bg-background"
                  >
                    <option value="all">Tous</option>
                    <option value="active">Actifs</option>
                    <option value="inactive">Inactifs</option>
                  </select>
                </div>
                <Input
                  type="text"
                  placeholder="Rechercher une ressource..."
                  value={resourceSearch}
                  onChange={e => setResourceSearch(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Blocage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources
                    .filter(r => resourceTypeFilter === "all" || r.type === resourceTypeFilter)
                    .filter(r => resourceStatusFilter === "all" || 
                      (resourceStatusFilter === "active" && r.is_active) || 
                      (resourceStatusFilter === "inactive" && !r.is_active))
                    .filter(r => r.name.toLowerCase().includes(resourceSearch.toLowerCase()))
                    .map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell>{resource.name}</TableCell>
                        <TableCell>{resource.type}</TableCell>
                        <TableCell>{resource.is_active ? "Oui" : "Non"}</TableCell>
                        <TableCell>{resource.block_reason || "-"}</TableCell>
                        <TableCell>{formatPlageBlocage(resource)}</TableCell>
                        <TableCell className="text-right">
                          {blockEdit[resource.id] ? (
                            <div className="flex flex-col gap-2">
                              <Input
                                type="text"
                                placeholder="Raison du blocage"
                                value={blockEdit[resource.id].reason}
                                onChange={e => setBlockEdit(prev => ({ ...prev, [resource.id]: { ...prev[resource.id], reason: e.target.value } }))}
                                className="mb-1"
                              />
                              <span className="text-xs text-muted-foreground">Début du blocage</span>
                              {renderSelecteurDate(resource.id, "from", "Immédiat")}
                              <span className="text-xs text-muted-foreground">Fin du blocage</span>
                              {renderSelecteurDate(resource.id, "until", "Sans fin")}
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" onClick={() => saveBlockInfo(resource.id)}>Enregistrer</Button>
                                <Button size="sm" variant="outline" onClick={() => setBlockEdit(prev => { const copy = { ...prev }; delete copy[resource.id]; return copy; })}>Annuler</Button>
                              </div>
                            </div>
                          ) : resource.is_active ? (
                            <Button size="sm" variant="destructive" onClick={() => setBlockEdit(prev => ({ ...prev, [resource.id]: { reason: "", from: "", until: "" } }))}>
                              Désactiver
                            </Button>
                          ) : (
                            <Button size="sm" variant="default" onClick={() => toggleResourceActive(resource.id, true)}>
                              Activer
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 