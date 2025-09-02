import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useToast } from "../hooks/use-toast";

// API Types
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_banned: boolean;
  ban_reason?: string;
  created_at: string;
  last_login?: string;
}

export interface AdminStory {
  id: string;
  title: string;
  description: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    username: string;
    full_name: string;
  };
  view_count?: number;
  like_count?: number;
  download_count?: number;
}

export interface SubscriptionCode {
  id: string;
  code: string;
  subscription_type: string;
  is_used: boolean;
  expires_at: string;
  created_at: string;
  used_by?: {
    username: string;
    full_name: string;
  };
  created_by?: {
    username: string;
    full_name: string;
  };
}

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  type: string;
  is_published: boolean;
  published_at?: string;
  created_at: string;
  author: {
    id: string;
    username: string;
    full_name: string;
  };
}

export interface LegendaryCharacter {
  id: string;
  name: string;
  photo_url?: string;
  short_description: string;
  full_bio: string;
  role: string;
  origin: string;
  powers?: string;
  created_at: string;
}

export interface AdminStats {
  users: number;
  travelers: number;
  lords: number;
  stories: number;
  revenue_month: number;
  recentUsers?: { id: string; username: string; email: string }[];
  recentStories?: { id: string; title: string; author: string }[];
}

// Helper function to get auth token
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};

// API functions
const adminAPI = {
  // Stats
  getStats: async (): Promise<AdminStats> => {
    const token = await getAuthToken();
    const response = await fetch('/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  // Users
  getUsers: async (): Promise<AdminUser[]> => {
    const token = await getAuthToken();
    const response = await fetch('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  banUser: async (userId: string, banned: boolean, reason?: string): Promise<AdminUser> => {
    const token = await getAuthToken();
    const response = await fetch(`/api/admin/users/${userId}/ban`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ banned, reason }),
    });
    if (!response.ok) throw new Error('Failed to update user ban status');
    return response.json();
  },

  // Stories
  getStories: async (): Promise<AdminStory[]> => {
    const token = await getAuthToken();
    const response = await fetch('/api/admin/stories', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch stories');
    return response.json();
  },

  publishStory: async (storyId: string, published: boolean): Promise<AdminStory> => {
    const token = await getAuthToken();
    const response = await fetch(`/api/admin/stories/${storyId}/publish`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ published }),
    });
    if (!response.ok) throw new Error('Failed to update story publish status');
    return response.json();
  },

  deleteStory: async (storyId: string): Promise<void> => {
    const token = await getAuthToken();
    const response = await fetch(`/api/admin/stories/${storyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to delete story');
  },

  // Subscription Codes
  getSubscriptionCodes: async (): Promise<SubscriptionCode[]> => {
    const token = await getAuthToken();
    const response = await fetch('/api/admin/subscription-codes', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch subscription codes');
    return response.json();
  },

  createSubscriptionCodes: async (data: {
    subscription_type: string;
    quantity: number;
    expires_days: number;
  }): Promise<SubscriptionCode[]> => {
    const token = await getAuthToken();
    const response = await fetch('/api/admin/subscription-codes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create subscription codes');
    return response.json();
  },

  // News
  getNews: async (type: string = 'general'): Promise<NewsArticle[]> => {
    const token = await getAuthToken();
    const response = await fetch(`/api/admin/news?type=${type}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch news');
    return response.json();
  },

  createNews: async (data: {
    title: string;
    content: string;
    type?: string;
  }): Promise<NewsArticle> => {
    const token = await getAuthToken();
    const response = await fetch('/api/admin/news', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create news article');
    return response.json();
  },

  deleteNews: async (newsId: string): Promise<void> => {
    const token = await getAuthToken();
    const response = await fetch(`/api/admin/news/${newsId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to delete news article');
  },

  // Legendary Characters
  getLegendaryCharacters: async (): Promise<LegendaryCharacter[]> => {
    const token = await getAuthToken();
    const response = await fetch('/api/admin/legendary-characters', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch legendary characters');
    return response.json();
  },

  createLegendaryCharacter: async (data: Omit<LegendaryCharacter, 'id' | 'created_at'>): Promise<LegendaryCharacter> => {
    const token = await getAuthToken();
    const response = await fetch('/api/admin/legendary-characters', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create legendary character');
    return response.json();
  },

  updateLegendaryCharacter: async (id: string, data: Omit<LegendaryCharacter, 'id' | 'created_at'>): Promise<LegendaryCharacter> => {
    const token = await getAuthToken();
    const response = await fetch(`/api/admin/legendary-characters/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update legendary character');
    return response.json();
  },

  deleteLegendaryCharacter: async (id: string): Promise<void> => {
    const token = await getAuthToken();
    const response = await fetch(`/api/admin/legendary-characters/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to delete legendary character');
  },

  // Reports
  getReports: async (): Promise<any[]> => {
    const token = await getAuthToken();
    const res = await fetch('/api/admin/reports', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },

  updateReportStatus: async (id: string, status: string): Promise<void> => {
    const token = await getAuthToken();
    const res = await fetch(`/api/admin/reports/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update report');
  },
};

// Context
interface AdminAPIContextType {
  // Stats
  stats: {
    data?: AdminStats;
    isLoading: boolean;
    error?: Error;
    refetch: () => void;
  };

  // Users
  users: {
    data?: AdminUser[];
    isLoading: boolean;
    error?: Error;
    refetch: () => void;
  };
  banUser: (userId: string, banned: boolean, reason?: string) => Promise<void>;

  // Stories
  stories: {
    data?: AdminStory[];
    isLoading: boolean;
    error?: Error;
    refetch: () => void;
  };
  publishStory: (storyId: string, published: boolean) => Promise<void>;
  deleteStory: (storyId: string) => Promise<void>;

  // Subscription Codes
  subscriptionCodes: {
    data?: SubscriptionCode[];
    isLoading: boolean;
    error?: Error;
    refetch: () => void;
  };
  createSubscriptionCodes: (data: {
    subscription_type: string;
    quantity: number;
    expires_days: number;
  }) => Promise<void>;

  // News
  getNews: (type?: string) => Promise<NewsArticle[]>;
  createNews: (data: { title: string; content: string; type?: string }) => Promise<void>;
  deleteNews: (newsId: string) => Promise<void>;

  // Legendary Characters
  legendaryCharacters: {
    data?: LegendaryCharacter[];
    isLoading: boolean;
    error?: Error;
    refetch: () => void;
  };
  createLegendaryCharacter: (data: Omit<LegendaryCharacter, 'id' | 'created_at'>) => Promise<void>;
  updateLegendaryCharacter: (id: string, data: Omit<LegendaryCharacter, 'id' | 'created_at'>) => Promise<void>;
  deleteLegendaryCharacter: (id: string) => Promise<void>;

  // Reports
  reports: {
    data?: any[];
    isLoading: boolean;
    error?: Error;
    refetch: () => void;
  };
  updateReportStatus: (id: string, status: string) => Promise<void>;
}

const AdminAPIContext = createContext<AdminAPIContextType | undefined>(undefined);

export function AdminAPIProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Stats query
  const statsQuery = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminAPI.getStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Users query
  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminAPI.getUsers,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Reports query
  const reportsQuery = useQuery<any[], Error>({
    queryKey: ['admin','reports'],
    queryFn: adminAPI.getReports,
  });

  // Update report status
  const updateReportStatusMutation = useMutation({
    mutationFn: ({id,status}:{id:string;status:string})=>adminAPI.updateReportStatus(id,status),
    onSuccess: ()=> {
      queryClient.invalidateQueries({queryKey:['admin','reports']});
      toast({title:'Report updated'});
    },
    onError:(error)=>toast({title:'Error',description:error.message,variant:'destructive'}),
  });

  // Stories query
  const storiesQuery = useQuery({
    queryKey: ['admin', 'stories'],
    queryFn: adminAPI.getStories,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Subscription codes query
  const subscriptionCodesQuery = useQuery({
    queryKey: ['admin', 'subscription-codes'],
    queryFn: adminAPI.getSubscriptionCodes,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Legendary characters query
  const legendaryCharactersQuery = useQuery({
    queryKey: ['admin', 'legendary-characters'],
    queryFn: adminAPI.getLegendaryCharacters,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutations
  const banUserMutation = useMutation({
    mutationFn: ({ userId, banned, reason }: { userId: string; banned: boolean; reason?: string }) =>
      adminAPI.banUser(userId, banned, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({
        title: "User updated",
        description: "User ban status updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const publishStoryMutation = useMutation({
    mutationFn: ({ storyId, published }: { storyId: string; published: boolean }) =>
      adminAPI.publishStory(storyId, published),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'stories'] });
      toast({
        title: "Story updated",
        description: "Story publish status updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteStoryMutation = useMutation({
    mutationFn: adminAPI.deleteStory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'stories'] });
      toast({
        title: "Story deleted",
        description: "Story deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createSubscriptionCodesMutation = useMutation({
    mutationFn: adminAPI.createSubscriptionCodes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscription-codes'] });
      toast({
        title: "Codes created",
        description: "Subscription codes created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createNewsMutation = useMutation({
    mutationFn: adminAPI.createNews,
    onSuccess: () => {
      toast({
        title: "News created",
        description: "News article created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteNewsMutation = useMutation({
    mutationFn: adminAPI.deleteNews,
    onSuccess: () => {
      toast({
        title: "News deleted",
        description: "News article deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createLegendaryCharacterMutation = useMutation({
    mutationFn: adminAPI.createLegendaryCharacter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'legendary-characters'] });
      toast({
        title: "Character created",
        description: "Legendary character created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateLegendaryCharacterMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<LegendaryCharacter, 'id' | 'created_at'> }) =>
      adminAPI.updateLegendaryCharacter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'legendary-characters'] });
      toast({
        title: "Character updated",
        description: "Legendary character updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteLegendaryCharacterMutation = useMutation({
    mutationFn: adminAPI.deleteLegendaryCharacter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'legendary-characters'] });
      toast({
        title: "Character deleted",
        description: "Legendary character deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const value: AdminAPIContextType = {
    stats: {
      data: statsQuery.data,
      isLoading: statsQuery.isLoading,
      error: statsQuery.error as Error,
      refetch: statsQuery.refetch,
    },
    users: {
      data: usersQuery.data,
      isLoading: usersQuery.isLoading,
      error: usersQuery.error as Error,
      refetch: usersQuery.refetch,
    },
    banUser: async (userId: string, banned: boolean, reason?: string) => {
      await banUserMutation.mutateAsync({ userId, banned, reason });
    },
    stories: {
      data: storiesQuery.data,
      isLoading: storiesQuery.isLoading,
      error: storiesQuery.error as Error,
      refetch: storiesQuery.refetch,
    },
    publishStory: async (storyId: string, published: boolean) => {
      await publishStoryMutation.mutateAsync({ storyId, published });
    },
    deleteStory: async (storyId: string) => {
      await deleteStoryMutation.mutateAsync(storyId);
    },
    subscriptionCodes: {
      data: subscriptionCodesQuery.data,
      isLoading: subscriptionCodesQuery.isLoading,
      error: subscriptionCodesQuery.error as Error,
      refetch: subscriptionCodesQuery.refetch,
    },
    createSubscriptionCodes: async (data) => {
      await createSubscriptionCodesMutation.mutateAsync(data);
    },
    getNews: adminAPI.getNews,
    createNews: async (data) => {
      await createNewsMutation.mutateAsync(data);
    },
    deleteNews: async (newsId) => {
      await deleteNewsMutation.mutateAsync(newsId);
    },
    legendaryCharacters: {
      data: legendaryCharactersQuery.data,
      isLoading: legendaryCharactersQuery.isLoading,
      error: legendaryCharactersQuery.error as Error,
      refetch: legendaryCharactersQuery.refetch,
    },
    createLegendaryCharacter: async (data) => {
      await createLegendaryCharacterMutation.mutateAsync(data);
    },
    updateLegendaryCharacter: async (id, data) => {
      await updateLegendaryCharacterMutation.mutateAsync({ id, data });
    },
    deleteLegendaryCharacter: async (id) => {
      await deleteLegendaryCharacterMutation.mutateAsync(id);
    },
    // Reports
    reports: {
      data: reportsQuery.data as any[],
      isLoading: reportsQuery.isLoading,
      error: reportsQuery.error as Error,
      refetch: reportsQuery.refetch,
    },
    updateReportStatus: async (id,status)=>{
      await updateReportStatusMutation.mutateAsync({id,status});
    },
  };

  return (
    <AdminAPIContext.Provider value={value}>
      {children}
    </AdminAPIContext.Provider>
  );
}

export function useAdminAPI() {
  const context = useContext(AdminAPIContext);
  if (!context) {
    throw new Error('useAdminAPI must be used within AdminAPIProvider');
  }
  return context;
}
