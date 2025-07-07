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
  const [blockEdit, setBlockEdit] = useState<{[id: string]: {reason: string, until: string}}>({});
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
    const { data, error } = await supabase.from("resources").select("id, name, type, is_active, block_reason, block_until");
    if (!error) setResources(data || []);
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
          block_until: null 
        })
        .eq("id", resourceId);

      if (!error) {
        setResources(resources.map(r => 
          r.id === resourceId 
            ? { ...r, is_active: true, block_reason: undefined, block_until: undefined } 
            : r
        ));
        toast({ title: `Ressource activée` });
      }
    } else {
      setBlockEdit(prev => ({
        ...prev,
        [resourceId]: { 
          reason: resources.find(r => r.id === resourceId)?.block_reason || "", 
          until: resources.find(r => r.id === resourceId)?.block_until?.slice(0, 16) || "" 
        }
      }));
    }
  };

  const saveBlockInfo = async (resourceId: string) => {
    const { reason, until } = blockEdit[resourceId] || {};
    const { error } = await supabase.from("resources").update({ is_active: false, block_reason: reason, block_until: until ? new Date(until).toISOString() : null }).eq("id", resourceId);
    if (!error) {
      setResources(resources.map(r => r.id === resourceId ? { ...r, is_active: false, block_reason: reason, block_until: until } : r));
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

  const handleAvatarChange = async (user: User, file: File) => {
    // On suppose que tu as un bucket 'avatars' dans Supabase Storage
    const fileExt = file.name.split('.').pop();
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
            <Button variant={activeTab === 'users' ? 'default' : 'outline'} onClick={() => setActiveTab('users')}>
              Gestion des utilisateurs
            </Button>
            <Button variant={activeTab === 'resources' ? 'default' : 'outline'} onClick={() => setActiveTab('resources')}>
              Gestion des ressources
            </Button>
          </div>

          {activeTab === 'users' && (
            <>
              <h1 className="text-2xl font-bold mb-6">Gestion des administrateurs</h1>
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
              <h2 className="text-2xl font-bold mb-6">Gestion des ressources</h2>
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
                    <TableHead>Jusqu'au</TableHead>
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
                        <TableCell>{resource.block_until ? format(new Date(resource.block_until), "yyyy-MM-dd HH:mm") : "-"}</TableCell>
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
                              <Popover open={datePickerOpen[resource.id]} onOpenChange={open => setDatePickerOpen(prev => ({ ...prev, [resource.id]: open }))}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal"
                                    onClick={() => setDatePickerOpen(prev => ({ ...prev, [resource.id]: true }))}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {blockEdit[resource.id].until ? format(new Date(blockEdit[resource.id].until), "yyyy-MM-dd HH:mm") : "Choisir une date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={blockEdit[resource.id].until ? new Date(blockEdit[resource.id].until) : undefined}
                                    onSelect={date => {
                                      if (date) {
                                        const iso = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                        setBlockEdit(prev => ({ ...prev, [resource.id]: { ...prev[resource.id], until: iso } }));
                                        setDatePickerOpen(prev => ({ ...prev, [resource.id]: false }));
                                      }
                                    }}
                                    className="rounded-md border"
                                  />
                                </PopoverContent>
                              </Popover>
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" onClick={() => saveBlockInfo(resource.id)}>Enregistrer</Button>
                                <Button size="sm" variant="outline" onClick={() => setBlockEdit(prev => { const copy = { ...prev }; delete copy[resource.id]; return copy; })}>Annuler</Button>
                              </div>
                            </div>
                          ) : resource.is_active ? (
                            <Button size="sm" variant="destructive" onClick={() => setBlockEdit(prev => ({ ...prev, [resource.id]: { reason: "", until: "" } }))}>
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