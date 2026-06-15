import { createClient } from '@insforge/sdk';

const BASE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL || 'https://dk378yzj.us-east.insforge.app';
const ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MjU4OTd9.u_lzMW5_tIucHcFXzN0Fuc0JB_AXIOcV2YkSUqpFuCA';

export const insforge = createClient({
  baseUrl: BASE_URL,
  anonKey: ANON_KEY,
});
