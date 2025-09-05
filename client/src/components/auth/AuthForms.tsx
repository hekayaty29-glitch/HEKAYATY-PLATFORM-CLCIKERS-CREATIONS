import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, CircleAlert } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export function LoginForm() {
  const { loginWithGoogle } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      await loginWithGoogle();
      navigate("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-900 p-3 rounded-md flex items-start text-sm">
          <CircleAlert className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Google login */}
      <Button 
        type="button" 
        variant="outline" 
        className="w-full flex items-center justify-center gap-2" 
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5" />
        {isLoading ? "Signing in..." : "Continue with Google"}
      </Button>
    </div>
  );
}

// Register form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(2, "Full name is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain at least one letter"),
  confirmPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain at least one letter"),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions",
  }),
  isPremium: z.boolean().optional()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

interface RegisterFormProps {
  isPremium?: boolean;
}

export function RegisterForm({ isPremium = false }: RegisterFormProps) {
  const { loginWithGoogle } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const handleGoogleSignUp = async () => {
    if (!agreeTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      await loginWithGoogle();
      
      // If registration specified premium, handle upgrade
      if (isPremium) {
        navigate("/upgrade");
      } else {
        // Small delay to ensure auth state is established
        setTimeout(() => {
          navigate("/setup-username");
        }, 100);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-900 p-3 rounded-md flex items-start text-sm">
          <CircleAlert className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Google sign up */}
      <Button 
        type="button" 
        variant="outline" 
        className="w-full flex items-center justify-center gap-2" 
        onClick={handleGoogleSignUp}
        disabled={isLoading}
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5" />
        {isLoading ? "Creating Account..." : "Continue with Google"}
      </Button>
      
      {/* Terms and Privacy Policy */}
      <div className="flex flex-row items-start space-x-3 space-y-0">
        <Checkbox 
          checked={agreeTerms}
          onCheckedChange={(checked) => setAgreeTerms(checked === true)}
          className="border-amber-500 data-[state=checked]:bg-amber-500"
        />
        <div className="space-y-1 leading-none">
          <label className="text-sm text-gray-600">
            I agree to the <a href="/terms" className="text-amber-500 hover:text-amber-700">Terms of Service</a> and <a href="/privacy" className="text-amber-500 hover:text-amber-700">Privacy Policy</a>
          </label>
        </div>
      </div>
    </div>
  );
}
