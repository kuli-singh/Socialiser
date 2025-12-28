"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, MapPin, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Assuming this exists, if not I'll stick to basic labels or check imports
// Actually, let's play it safe and stick to standard HTML labels if Label isn't confirmed, 
// but Friends page used standard HTML form elements? No, Friends page used specific shadcn components if available.
// I will use standard HTML labels for consistency with what I saw in app/locations/page.tsx previously, simplified.

interface Location {
  id: string;
  name: string;
  type: string;
  address?: string;
  description?: string;
  website?: string;
}

export default function LocationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "Venue",
    address: "",
    description: "",
    website: "",
  });

  useEffect(() => {
    if (session) {
      fetchLocations();
    }
  }, [session]);

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/locations");
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (error) {
      console.error("Failed to fetch locations", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", type: "Venue", address: "", description: "", website: "" });
    setEditingLocationId(null);
    setShowAddForm(false);
  };

  const handleEditClick = (location: Location) => {
    setFormData({
      name: location.name,
      type: location.type,
      address: location.address || "",
      description: location.description || "",
      website: location.website || ""
    });
    setEditingLocationId(location.id);
    setShowAddForm(true);
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;

    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        fetchLocations();
      } else {
        alert("Failed to delete location");
      }
    } catch (error) {
      console.error("Error deleting location:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingLocationId
        ? `/api/locations/${editingLocationId}`
        : "/api/locations";

      const method = editingLocationId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        resetForm();
        fetchLocations();
      }
    } catch (error) {
      console.error("Failed to save location", error);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      <div className="flex justify-between items-center bg-white/50 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Locations
          </h1>
          <p className="text-slate-500 mt-1">Manage your favorite places and clubs</p>
        </div>
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="animate-in fade-in slide-in-from-top-4">
          <CardHeader>
            <CardTitle>{editingLocationId ? "Edit Location" : "Add New Place"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Name</label>
                  <Input
                    required
                    placeholder="e.g. Oxford Running Club"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Type</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Venue">Venue</option>
                    <option value="Club">Club</option>
                    <option value="Organization">Organization</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Address / Location</label>
                  <Input
                    placeholder="e.g. 123 High St, Oxford"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editingLocationId ? "Update" : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((loc) => (
          <Card key={loc.id} className="group hover:shadow-md transition-all hover:-translate-y-1">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                    {loc.name}
                  </h3>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                    {loc.type}
                  </span>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <MapPin size={20} />
                </div>
              </div>
              {loc.address && (
                <p className="mt-3 text-sm text-slate-500 flex items-center gap-1">
                  {loc.address}
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClick(loc)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(loc.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
