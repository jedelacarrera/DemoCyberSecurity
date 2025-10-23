declare module "node-fetch" {
  interface RequestInit {
    method?: string;
    headers?: Record<string, string>;
    body?: string | Buffer;
    timeout?: number;
    redirect?: "follow" | "manual" | "error";
  }

  interface Response {
    ok: boolean;
    status: number;
    statusText: string;
    headers: Headers;
    text(): Promise<string>;
    json(): Promise<any>;
    buffer(): Promise<Buffer>;
  }

  function fetch(url: string, init?: RequestInit): Promise<Response>;

  export = fetch;
}
