export type ComposeObject = Record<string, unknown>;

export interface ComposeService {
  container_name?: string;
  image?: string;
  restart?: string;
  shm_size?: string;
  user?: string;
  ports?: string[];
  volumes?: string[];
  depends_on?: string[];
  devices?: string[];
  security_opt?: string[];
  cap_drop?: string[];
  group_add?: string[];
  device_cgroup_rules?: string[];
  environment?: Record<string, string>;
  healthcheck?: { test?: string; disable?: boolean };
  deploy?: {
    resources?: {
      reservations?: {
        devices?: { driver: string; count: number; capabilities: string[] }[];
      };
    };
  };
}
