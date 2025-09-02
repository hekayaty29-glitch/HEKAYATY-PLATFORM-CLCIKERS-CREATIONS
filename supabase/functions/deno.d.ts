// Deno global types for Supabase Edge Functions
declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
  };
  
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

// Global JavaScript types for Deno runtime
declare const JSON: {
  parse(text: string): any;
  stringify(value: any): string;
};

declare const Date: DateConstructor;
declare const Boolean: BooleanConstructor;

interface String {
  split(separator?: string | RegExp, limit?: number): string[];
}
