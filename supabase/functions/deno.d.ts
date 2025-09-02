// Deno global types for Supabase Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve: (handler: (request: Request) => Response | Promise<Response>) => void;
};

// Global JavaScript types for Deno runtime
declare const JSON: {
  parse(text: string): any;
  stringify(value: any): string;
};

declare const Date: DateConstructor;
declare const Boolean: BooleanConstructor;

// Module declarations for ESM imports
declare module "https://esm.sh/@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
}

declare module "https://esm.sh/v135/@supabase/supabase-js@2.52.1/dist/module/index.js" {
  export * from "@supabase/supabase-js";
}

// Additional ESM module patterns
declare module "https://esm.sh/*" {
  const content: any;
  export = content;
}
