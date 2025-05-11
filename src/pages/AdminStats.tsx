import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import supabase from "@/supabase";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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
  profiles: {
    display_name: string;
    avatar_url: string;
  };
}

const AdminStats: React.FC = () => {
  const { currentUser } = useAuth();
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [reports, setReports] = useState<TTReport[]>([]);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [showMine, setShowMine] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const fetchReports = async () => {
    console.log("fetchReports appelé avec startDate:", format(startDate, "yyyy-MM-dd"), "et endDate:", format(endDate, "yyyy-MM-dd"));
    const { data, error } = await supabase
      .from("tt_reports")
      .select("*")
      .gte("date", format(startDate, "yyyy-MM-dd"))
      .lte("date", format(endDate, "yyyy-MM-dd"))
      .order("date", { ascending: false });

    if (error) {
      console.error("Erreur lors de la récupération des rapports:", error);
      return;
    }

    console.log("Données récupérées:", data);
    if (data) {
      const userIds = data.map(report => report.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      if (profilesError) {
        console.error("Erreur lors de la récupération des profils:", profilesError);
        return;
      }

      const reportsWithProfiles = data.map(report => ({
        ...report,
        profiles: profiles.find(p => p.id === report.user_id)
      }));
      setReports(reportsWithProfiles);
    } else {
      setReports([]);
    }

    // Calculer les statistiques quotidiennes
    const stats = data?.reduce((acc: any[], report) => {
      const date = report.date;
      const existingStat = acc.find(stat => stat.date === date);
      
      if (existingStat) {
        existingStat.count++;
        existingStat.desk_availability = Math.min(existingStat.desk_availability, report.details.desk_availability);
        existingStat.parking_availability = Math.min(existingStat.parking_availability, report.details.parking_availability);
        existingStat.baby_availability = Math.min(existingStat.baby_availability, report.details.baby_availability);
      } else {
        acc.push({
          date,
          count: 1,
          desk_availability: report.details.desk_availability,
          parking_availability: report.details.parking_availability,
          baby_availability: report.details.baby_availability,
        });
      }
      return acc;
    }, []);

    setDailyStats(stats || []);
  };

  const exportCSV = () => {
    const header = ["Date", "Utilisateur", "Disponibilité Bureaux", "Disponibilité Parking"];
    const rows = reports
      .filter(report => !showMine || (currentUser && report.user_id === currentUser.id))
      .map(report => [
        format(new Date(report.date), "dd/MM/yyyy", { locale: fr }),
        report.profiles?.display_name || "Utilisateur inconnu",
        report.details.desk_availability,
        report.details.parking_availability
      ]);
    const csvContent = [header, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "statistiques_tt.csv");
  };

  return (
    <div className="h-full flex flex-col grow gap-2 bg-background">
      <Header />
      <div className="container mx-auto p-6">
        <div className="bg-card p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">Statistiques des signalements TT</h1>
          <button onClick={exportCSV} className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Exporter en CSV</button>
          
          <div className="flex gap-4 mb-6">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP", { locale: fr }) : "Date de début"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP", { locale: fr }) : "Date de fin"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              variant={showMine ? "default" : "outline"}
              onClick={() => setShowMine((v) => !v)}
            >
              {showMine ? "Voir tous les signalements" : "Voir mes signalements"}
            </Button>
          </div>

          <div className="h-[400px] mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), "dd/MM", { locale: fr })}
                />
                <YAxis 
                  tickFormatter={(value) => Math.round(value).toString()} 
                  domain={[0, 'auto']} 
                  allowDecimals={false}
                  ticks={[0,1,2,3,4,5]}
                />
                <Tooltip 
                  labelFormatter={(date) => format(new Date(date), "dd MMMM yyyy", { locale: fr })}
                  formatter={(value: number) => [value, "Signalements"]}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8884d8" 
                  name="Nombre de signalements"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Disponibilité Bureaux</TableHead>
                <TableHead>Disponibilité Parking</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports
                .filter(report => !showMine || (currentUser && report.user_id === currentUser.id))
                .map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{format(new Date(report.date), "dd/MM/yyyy", { locale: fr })}</TableCell>
                    <TableCell>{report.profiles?.display_name || "Utilisateur inconnu"}</TableCell>
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

export default AdminStats; 