import { Helmet } from "react-helmet";
import { Megaphone, Plus, Edit, Trash2, X, Upload, Image } from "lucide-react";
import { useState, useRef } from "react";
import { useNews, NewsItem } from "@/hooks/useNews";
import { Search } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { useAdminAPI } from "@/context/AdminAPIContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import newsBackground from "@/assets/Lucid_Realism_a_cinematic_photo_of_a_cinematic_fantasy_backgro_3.jpg";


export default function HekayatyNewsPage() {
  const [search, setSearch] = useState("");
  const { data: news = [], isLoading, error, refetch } = useNews("main");
  const filtered = news.filter((n) => n.title.toLowerCase().includes(search.toLowerCase()));
  
  // Admin functionality
  const { isAdmin } = useAdmin();
  const { createNews, deleteNews } = useAdminAPI();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [adminForm, setAdminForm] = useState({ title: "", content: "", cover_url: "" });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'news');
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/file-upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    
    const data = await response.json();
    return data.url;
  };

  const handleCreateNews = async () => {
    if (!adminForm.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      let imageUrl = "";
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }
      
      await createNews({ 
        ...adminForm, 
        type: 'main',
        cover_url: imageUrl 
      });
      
      setAdminForm({ title: "", content: "", cover_url: "" });
      setSelectedImage(null);
      setImagePreview("");
      setShowAdminPanel(false);
      refetch();
      toast({
        title: "Success",
        description: "News post created successfully!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create news post",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm("Are you sure you want to delete this news post?")) return;

    try {
      await deleteNews(id);
      refetch();
      toast({
        title: "Success",
        description: "News post deleted successfully!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete news post",
        variant: "destructive"
      });
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed text-amber-50 py-20 px-4 relative"
      style={{ backgroundImage: `url(${newsBackground})` }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>
      <div className="relative z-10">
      <Helmet>
        <title>Hekayaty News & Announcements</title>
        <meta name="description" content="All official announcements, competition results and new story updates from Hekayaty." />
      </Helmet>

      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center justify-center gap-3 mb-10">
          <Megaphone className="h-8 w-8 text-amber-400" />
          <h1 className="font-cinzel text-4xl md:text-5xl font-bold">Hekayaty News</h1>
          <Megaphone className="h-8 w-8 text-amber-400" />
        </div>

        <div className="relative max-w-md mx-auto mb-12">
          <input
            type="text"
            placeholder="Search news..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-3 pl-4 pr-10 rounded-full bg-amber-50/10 placeholder-amber-100 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-400" />
        </div>

        {/* Admin Panel */}
        {isAdmin && (
          <div className="mb-8">
            <Button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="bg-amber-600 hover:bg-amber-700 text-white mb-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add News Post
            </Button>
            
            {showAdminPanel && (
              <div className="bg-amber-50/10 p-6 rounded-lg border border-amber-500 mb-8">
                <h3 className="font-cinzel text-xl mb-4 text-amber-100">Create News Post</h3>
                
                <div className="space-y-4">
                  <Input
                    placeholder="News title..."
                    value={adminForm.title}
                    onChange={(e) => setAdminForm({ ...adminForm, title: e.target.value })}
                    className="bg-amber-50/10 border-amber-500 text-amber-50 placeholder-amber-300"
                  />
                  
                  <textarea
                    placeholder="News content..."
                    value={adminForm.content}
                    onChange={(e) => setAdminForm({ ...adminForm, content: e.target.value })}
                    className="w-full p-3 rounded-lg bg-amber-50/10 border border-amber-500 text-amber-50 placeholder-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[120px] resize-vertical"
                  />
                  
                  <div className="space-y-2">
                    <label className="block text-amber-200 text-sm font-medium">Add Image (Optional)</label>
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="border-amber-500 text-amber-200 hover:bg-amber-50/10"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Image
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      {selectedImage && (
                        <span className="text-amber-300 text-sm">{selectedImage.name}</span>
                      )}
                    </div>
                    
                    {imagePreview && (
                      <div className="mt-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-xs max-h-48 rounded-lg border border-amber-500"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={handleCreateNews}
                      disabled={isUploading}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {isUploading ? "Creating..." : "Create Post"}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAdminPanel(false);
                        setAdminForm({ title: "", content: "", cover_url: "" });
                        setSelectedImage(null);
                        setImagePreview("");
                      }}
                      variant="outline"
                      className="border-amber-500 text-amber-200 hover:bg-amber-50/10"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-8">
          {isLoading && <p className="text-center">Loading…</p>}
          {error && <p className="text-center text-red-500">{(error as Error).message}</p>}
          {filtered.map((item) => (
            <div key={item.id} className="bg-amber-50/10 p-6 rounded-lg border border-amber-500 hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm text-amber-300">{new Date(item.created_at).toLocaleDateString()}</p>
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleDeleteNews(item.id)}
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              <h2 className="font-cinzel text-2xl mb-4 text-amber-100">{item.title}</h2>
              
              {item.cover_url && (
                <div className="mb-4">
                  <img
                    src={item.cover_url}
                    alt={item.title}
                    className="w-full max-w-2xl rounded-lg border border-amber-500/30"
                  />
                </div>
              )}
              
              <p className="text-amber-200 mb-4 leading-relaxed">{item.content}</p>
              
              <span className="inline-block bg-amber-500 text-brown-dark text-xs font-semibold px-3 py-1 rounded-full capitalize">
                {item.type}
              </span>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
