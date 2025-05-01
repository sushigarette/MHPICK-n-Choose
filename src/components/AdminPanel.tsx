import React, { useState, useEffect } from "react";
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

interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  is_admin: boolean;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("display_name");

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
      return;
    }

    setUsers(data || []);
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_admin: !currentStatus } : user
      ));

      toast({
        title: "Succès",
        description: `Le statut administrateur a été ${!currentStatus ? "activé" : "désactivé"}`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut administrateur",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col grow gap-2 bg-background">
      <Header />
      <div className="container mx-auto p-6">
        <div className="bg-card p-6 rounded-lg shadow-md">
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Administrateur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="flex items-center gap-2">
                    <img
                      src={user.avatar_url || "/lio2.png"}
                      alt={user.display_name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span>{user.display_name}</span>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={user.is_admin}
                      onCheckedChange={() => toggleAdminStatus(user.id, user.is_admin)}
                      disabled={user.id === currentUser?.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 