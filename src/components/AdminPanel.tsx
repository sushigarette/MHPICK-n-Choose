import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useHalloween } from "@/context/HalloweenContext";
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
  const { isHalloweenMode } = useHalloween();
  const [users, setUsers] = useState<User[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'users' | 'resources' | 'theme'>('users');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("all");
  const [resourceSearch, setResourceSearch] = useState("");
  const [resourceStatusFilter, setResourceStatusFilter] = useState<string>("all");
  const [blockEdit, setBlockEdit] = useState<{[id: string]: {reason: string, until: string}}>({});
  const [datePickerOpen, setDatePickerOpen] = useState<{[id: string]: boolean}>({});
  const [globalHalloweenMode, setGlobalHalloweenMode] = useState<boolean>(false);
  const [halloweenRandomAudio, setHalloweenRandomAudio] = useState<boolean>(true);
  const [halloweenStormAudio, setHalloweenStormAudio] = useState<boolean>(true);
  const [halloweenStormVisual, setHalloweenStormVisual] = useState<boolean>(true);
  const [halloweenRain, setHalloweenRain] = useState<boolean>(true);
  const [halloweenSurprise, setHalloweenSurprise] = useState<boolean>(true);
  const [halloweenParticles, setHalloweenParticles] = useState<boolean>(false);
  const [halloweenFlyingBats, setHalloweenFlyingBats] = useState<boolean>(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");

  useEffect(() => {
    fetchUsers();
    fetchResources();
    fetchGlobalTheme();
  }, []);

  const fetchGlobalTheme = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['global_halloween_mode', 'halloween_random_audio', 'halloween_storm_audio', 'halloween_storm_visual', 'halloween_rain', 'halloween_surprise', 'halloween_particles', 'halloween_flying_bats']);
      
      if (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
        return;
      }
      
      // Traiter les résultats
      data.forEach(setting => {
        const value = setting.value === 'true';
        switch (setting.key) {
          case 'global_halloween_mode':
            setGlobalHalloweenMode(value);
            break;
          case 'halloween_random_audio':
            setHalloweenRandomAudio(value);
            break;
          case 'halloween_storm_audio':
            setHalloweenStormAudio(value);
            break;
          case 'halloween_storm_visual':
            setHalloweenStormVisual(value);
            break;
          case 'halloween_rain':
            setHalloweenRain(value);
            break;
          case 'halloween_surprise':
            setHalloweenSurprise(value);
            break;
          case 'halloween_particles':
            setHalloweenParticles(value);
            break;
          case 'halloween_flying_bats':
            setHalloweenFlyingBats(value);
            break;
        }
      });
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  };

  const updateSetting = async (key: string, value: boolean, setter: (value: boolean) => void, successMessage: string) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          value: value.toString(),
          updated_at: new Date().toISOString()
        })
        .eq('key', key);
      
      if (error) {
        console.error(`Erreur lors de la mise à jour de ${key}:`, error);
        toast({
          title: "Erreur",
          description: `Impossible de mettre à jour le paramètre ${key}`,
          variant: "destructive",
        });
        return;
      }
      
      setter(value);
      toast({
        title: "Paramètre mis à jour",
        description: successMessage,
      });
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de ${key}:`, error);
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour le paramètre ${key}`,
        variant: "destructive",
      });
    }
  };

  const updateGlobalTheme = (enabled: boolean) => {
    updateSetting(
      'global_halloween_mode',
      enabled,
      setGlobalHalloweenMode,
      enabled ? "Le thème Halloween est maintenant activé pour tout le site" : "Le thème Halloween est maintenant désactivé"
    );
  };

  const updateRandomAudio = (enabled: boolean) => {
    updateSetting(
      'halloween_random_audio',
      enabled,
      setHalloweenRandomAudio,
      enabled ? "Les sons aléatoires Halloween sont activés" : "Les sons aléatoires Halloween sont désactivés"
    );
  };

  const updateStormAudio = (enabled: boolean) => {
    updateSetting(
      'halloween_storm_audio',
      enabled,
      setHalloweenStormAudio,
      enabled ? "L'audio d'orage Halloween est activé" : "L'audio d'orage Halloween est désactivé"
    );
  };

  const updateStormVisual = (enabled: boolean) => {
    updateSetting(
      'halloween_storm_visual',
      enabled,
      setHalloweenStormVisual,
      enabled ? "Les effets visuels d'orage sont activés" : "Les effets visuels d'orage sont désactivés"
    );
  };

  const updateRain = (enabled: boolean) => {
    updateSetting(
      'halloween_rain',
      enabled,
      setHalloweenRain,
      enabled ? "La pluie Halloween est activée" : "La pluie Halloween est désactivée"
    );
  };

  const updateSurprise = (enabled: boolean) => {
    updateSetting(
      'halloween_surprise',
      enabled,
      setHalloweenSurprise,
      enabled ? "Les images surprises sont activées" : "Les images surprises sont désactivées"
    );
  };

  const updateParticles = (enabled: boolean) => {
    updateSetting(
      'halloween_particles',
      enabled,
      setHalloweenParticles,
      enabled ? "Les chauves-souris émojis sont activées" : "Les chauves-souris émojis sont désactivées"
    );
  };

  const updateFlyingBats = (enabled: boolean) => {
    updateSetting(
      'halloween_flying_bats',
      enabled,
      setHalloweenFlyingBats,
      enabled ? "Les chauves-souris animées sont activées" : "Les chauves-souris animées sont désactivées"
    );
  };

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
            <Button 
              variant={activeTab === 'users' ? 'default' : 'outline'} 
              onClick={() => setActiveTab('users')}
              className={isHalloweenMode ? 'halloween-glow' : ''}
            >
              {isHalloweenMode ? '👥 Gestion des utilisateurs 👻' : 'Gestion des utilisateurs'}
            </Button>
            <Button 
              variant={activeTab === 'resources' ? 'default' : 'outline'} 
              onClick={() => setActiveTab('resources')}
              className={isHalloweenMode ? 'halloween-glow' : ''}
            >
              {isHalloweenMode ? '🏢 Gestion des ressources 🎃' : 'Gestion des ressources'}
            </Button>
            <Button 
              variant={activeTab === 'theme' ? 'default' : 'outline'} 
              onClick={() => setActiveTab('theme')}
              className={isHalloweenMode ? 'halloween-glow' : ''}
            >
              {isHalloweenMode ? '🎨 Thème du site 🎃' : 'Thème du site'}
            </Button>
          </div>

          {activeTab === 'users' && (
            <>
              <h1 className={`text-2xl font-bold mb-6 ${isHalloweenMode ? 'halloween-spooky' : ''}`}>
                {isHalloweenMode ? '👻 Gestion des administrateurs 🦇' : 'Gestion des administrateurs'}
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
              <h2 className={`text-2xl font-bold mb-6 ${isHalloweenMode ? 'halloween-spooky' : ''}`}>
                {isHalloweenMode ? '🎃 Gestion des ressources 👻' : 'Gestion des ressources'}
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

          {activeTab === 'theme' && (
            <>
              <h2 className={`text-2xl font-bold mb-6 ${isHalloweenMode ? 'halloween-spooky' : ''}`}>
                {isHalloweenMode ? '🎨 Configuration du thème du site 🎃' : 'Configuration du thème du site'}
              </h2>
              
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {isHalloweenMode ? '🎃 Mode Halloween Global 👻' : 'Mode Halloween Global'}
                    </h3>
                    <p className="text-muted-foreground">
                      {isHalloweenMode 
                        ? '🎭 Activez ou désactivez le thème Halloween pour tous les utilisateurs du site 👻'
                        : 'Activez ou désactivez le thème Halloween pour tous les utilisateurs du site'
                      }
                    </p>
                  </div>
                  <Switch
                    checked={globalHalloweenMode}
                    onCheckedChange={updateGlobalTheme}
                    className={isHalloweenMode ? 'halloween-glow' : ''}
                  />
                </div>

                {/* Contrôles individuels des effets */}
                {globalHalloweenMode && (
                  <div className="space-y-4 border-t pt-6">
                    <h4 className="text-md font-semibold mb-4">
                      {isHalloweenMode ? '🎛️ Contrôles des effets Halloween 🎨' : 'Contrôles des effets Halloween'}
                    </h4>
                    
                    {/* Audio aléatoire */}
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <h5 className="font-medium">
                          {isHalloweenMode ? '🔊 Sons aléatoires 👻' : 'Sons aléatoires'}
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {isHalloweenMode 
                            ? '🎵 Chouette, hibou, rire effrayant toutes les 1-2 minutes 🦉'
                            : 'Chouette, hibou, rire effrayant toutes les 1-2 minutes'
                          }
                        </p>
                      </div>
                      <Switch
                        checked={halloweenRandomAudio}
                        onCheckedChange={updateRandomAudio}
                        className={isHalloweenMode ? 'halloween-glow' : ''}
                      />
                    </div>

                    {/* Audio d'orage */}
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <h5 className="font-medium">
                          {isHalloweenMode ? '⛈️ Audio d\'orage 🌩️' : 'Audio d\'orage'}
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {isHalloweenMode 
                            ? '🔊 Son d\'orage synchronisé avec les effets visuels ⛈️'
                            : 'Son d\'orage synchronisé avec les effets visuels'
                          }
                        </p>
                      </div>
                      <Switch
                        checked={halloweenStormAudio}
                        onCheckedChange={updateStormAudio}
                        className={isHalloweenMode ? 'halloween-glow' : ''}
                      />
                    </div>

                    {/* Effets visuels d'orage */}
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <h5 className="font-medium">
                          {isHalloweenMode ? '⚡ Effets visuels d\'orage 🌧️' : 'Effets visuels d\'orage'}
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {isHalloweenMode 
                            ? '✨ Éclairs, pluie intense, overlay violet ⛈️'
                            : 'Éclairs, pluie intense, overlay violet'
                          }
                        </p>
                      </div>
                      <Switch
                        checked={halloweenStormVisual}
                        onCheckedChange={updateStormVisual}
                        className={isHalloweenMode ? 'halloween-glow' : ''}
                      />
                    </div>

                    {/* Pluie normale */}
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <h5 className="font-medium">
                          {isHalloweenMode ? '🌧️ Pluie normale 💧' : 'Pluie normale'}
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {isHalloweenMode 
                            ? '💧 Pluie continue en arrière-plan 🌧️'
                            : 'Pluie continue en arrière-plan'
                          }
                        </p>
                      </div>
                      <Switch
                        checked={halloweenRain}
                        onCheckedChange={updateRain}
                        className={isHalloweenMode ? 'halloween-glow' : ''}
                      />
                    </div>

                    {/* Images surprises */}
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <h5 className="font-medium">
                          {isHalloweenMode ? '👻 Images surprises 😱' : 'Images surprises'}
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {isHalloweenMode 
                            ? '🖼️ Images qui apparaissent brusquement toutes les 10-30 secondes 👻'
                            : 'Images qui apparaissent brusquement toutes les 10-30 secondes'
                          }
                        </p>
                      </div>
                      <Switch
                        checked={halloweenSurprise}
                        onCheckedChange={updateSurprise}
                        className={isHalloweenMode ? 'halloween-glow' : ''}
                      />
                    </div>

                    {/* Chauves-souris émojis */}
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <h5 className="font-medium">
                          {isHalloweenMode ? '🦇 Chauves-souris émojis 🦇' : 'Chauves-souris émojis'}
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {isHalloweenMode 
                            ? '🦇 Chauves-souris émojis qui volent (différentes des bulles animées) 🦇'
                            : 'Chauves-souris émojis qui volent (différentes des bulles animées)'
                          }
                        </p>
                      </div>
                      <Switch
                        checked={halloweenParticles}
                        onCheckedChange={updateParticles}
                        className={isHalloweenMode ? 'halloween-glow' : ''}
                      />
                    </div>

                    {/* Chauves-souris animées */}
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <h5 className="font-medium">
                          {isHalloweenMode ? '🦇 Chauves-souris animées 🦇' : 'Chauves-souris animées'}
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {isHalloweenMode 
                            ? '🦇 Chauves-souris animées qui sautent de bas en haut 🦇'
                            : 'Chauves-souris animées qui sautent de bas en haut'
                          }
                        </p>
                      </div>
                      <Switch
                        checked={halloweenFlyingBats}
                        onCheckedChange={updateFlyingBats}
                        className={isHalloweenMode ? 'halloween-glow' : ''}
                      />
                    </div>
                  </div>
                )}
                
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">
                    {isHalloweenMode ? '📋 État actuel :' : 'État actuel :'}
                  </h4>
                  <p className={`text-sm ${globalHalloweenMode ? 'text-green-600' : 'text-gray-600'}`}>
                    {globalHalloweenMode 
                      ? (isHalloweenMode ? '🎃 Le thème Halloween est activé pour tout le site 👻' : 'Le thème Halloween est activé pour tout le site')
                      : (isHalloweenMode ? '🌙 Le thème normal est actif 🏠' : 'Le thème normal est actif')
                    }
                  </p>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">
                    {isHalloweenMode ? 'ℹ️ Information :' : 'Information :'}
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• {isHalloweenMode ? '🎭 Le changement s\'applique immédiatement à tous les utilisateurs 👻' : 'Le changement s\'applique immédiatement à tous les utilisateurs'}</li>
                    <li>• {isHalloweenMode ? '🎨 Les utilisateurs ne peuvent plus contrôler individuellement le thème 🎃' : 'Les utilisateurs ne peuvent plus contrôler individuellement le thème'}</li>
                    <li>• {isHalloweenMode ? '🔊 L\'audio d\'ambiance Halloween sera également activé/désactivé 👻' : 'L\'audio d\'ambiance Halloween sera également activé/désactivé'}</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 