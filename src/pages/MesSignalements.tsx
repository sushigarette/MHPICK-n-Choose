import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import supabase from "@/supabase";
import { useAuth } from "@/context/AuthContext";
import { format, subDays, addMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { saveAs } from "file-saver";

interface TTReport {
  id: string;
  user_id: string;
  date: string;
  reason: string;
  details: {
    desk_availability: number;
    parking_availability: number;
    baby_availability: number;
    total_reservations: number;
  };
  created_at: string;
}

const MesSignalements: React.FC = () => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<TTReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line
  }, [currentUser]);

  const fetchReports = async () => {
    if (!currentUser) {
      setError("Utilisateur non authentifié");
      console.log("currentUser est null ou undefined");
      return;
    }
    const { data, error } = await supabase
      .from("tt_reports")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("date", { ascending: false });
    if (error) {
      setError(error.message);
      console.error("Erreur Supabase:", error);
    } else {
      setError(null);
      setReports(data || []);
      console.log("Signalements récupérés:", data);
    }
  };

  const exportCSV = () => {
    const header = ["Date", "Disponibilité Bureaux", "Disponibilité Parking"];
    const rows = reports.map(report => [
      format(new Date(report.date), "dd/MM/yyyy", { locale: fr }),
      report.details.desk_availability,
      report.details.parking_availability
    ]);
    const csvContent = [header, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "mes_signalements.csv");
  };

  return (
    <div className="h-full flex flex-col grow gap-2 bg-background">
      <Header />
      <div className="container mx-auto p-6">
        <div className="bg-card p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">Mes signalements TT</h1>
          <button onClick={exportCSV} className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Exporter en CSV</button>
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">Erreur : {error}</div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Disponibilité Bureaux</TableHead>
                <TableHead>Disponibilité Parking</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{format(new Date(report.date), "dd/MM/yyyy", { locale: fr })}</TableCell>
                  <TableCell>{report.details.desk_availability}</TableCell>
                  <TableCell>{report.details.parking_availability}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default MesSignalements; 