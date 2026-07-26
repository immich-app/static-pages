import type { ComposeObject } from './types';

export const TRANSCODE_BACKENDS = {
  cpu: { label: 'None (CPU)', fragment: {} },
  nvenc: {
    label: 'NVIDIA (NVENC)',
    fragment: {
      deploy: {
        resources: {
          reservations: {
            devices: [{ driver: 'nvidia', count: 1, capabilities: ['gpu', 'compute', 'video'] }],
          },
        },
      },
    },
  },
  quicksync: {
    label: 'Intel QuickSync',
    fragment: { devices: ['/dev/dri:/dev/dri'] },
  },
  rkmpp: {
    label: 'Rockchip (RKMPP)',
    fragment: {
      security_opt: ['systempaths=unconfined', 'apparmor=unconfined'],
      group_add: ['video'],
      devices: [
        '/dev/rga:/dev/rga',
        '/dev/dri:/dev/dri',
        '/dev/dma_heap:/dev/dma_heap',
        '/dev/mpp_service:/dev/mpp_service',
      ],
    },
  },
  vaapi: {
    label: 'VA-API',
    fragment: { devices: ['/dev/dri:/dev/dri'] },
  },
  'vaapi-wsl': {
    label: 'VA-API (WSL2)',
    fragment: {
      devices: ['/dev/dri:/dev/dri', '/dev/dxg:/dev/dxg'],
      volumes: ['/usr/lib/wsl:/usr/lib/wsl'],
      environment: { LIBVA_DRIVER_NAME: 'd3d12' },
    },
  },
} satisfies Record<string, { label: string; fragment: ComposeObject }>;

export type TranscodeAccel = keyof typeof TRANSCODE_BACKENDS;

export const ML_BACKENDS = {
  cpu: { label: 'None (CPU)', tag: '', fragment: {} },
  armnn: {
    label: 'ARM NN (Mali)',
    tag: '-armnn',
    fragment: {
      devices: ['/dev/mali0:/dev/mali0'],
      volumes: [
        '/lib/firmware/mali_csffw.bin:/lib/firmware/mali_csffw.bin:ro',
        '/usr/lib/libmali.so:/usr/lib/libmali.so:ro',
      ],
    },
  },
  cuda: {
    label: 'NVIDIA (CUDA)',
    tag: '-cuda',
    fragment: {
      deploy: {
        resources: {
          reservations: {
            devices: [{ driver: 'nvidia', count: 1, capabilities: ['gpu'] }],
          },
        },
      },
    },
  },
  rocm: {
    label: 'AMD (ROCm)',
    tag: '-rocm',
    fragment: { group_add: ['video'], devices: ['/dev/dri:/dev/dri', '/dev/kfd:/dev/kfd'] },
  },
  openvino: {
    label: 'Intel (OpenVINO)',
    tag: '-openvino',
    fragment: {
      device_cgroup_rules: ['c 189:* rmw'],
      devices: ['/dev/dri:/dev/dri'],
      volumes: ['/dev/bus/usb:/dev/bus/usb'],
    },
  },
  'openvino-wsl': {
    label: 'Intel OpenVINO (WSL2)',
    tag: '-openvino',
    fragment: {
      devices: ['/dev/dri:/dev/dri', '/dev/dxg:/dev/dxg'],
      volumes: ['/dev/bus/usb:/dev/bus/usb', '/usr/lib/wsl:/usr/lib/wsl'],
    },
  },
  rknn: {
    label: 'Rockchip (RKNN)',
    tag: '-rknn',
    fragment: { security_opt: ['systempaths=unconfined', 'apparmor=unconfined'], devices: ['/dev/dri:/dev/dri'] },
  },
} satisfies Record<string, { label: string; tag: string; fragment: ComposeObject }>;

export type MlAccel = keyof typeof ML_BACKENDS;

export const TRANSCODE_ACCELS = Object.entries(TRANSCODE_BACKENDS).map(([value, { label }]) => ({
  value: value as TranscodeAccel,
  label,
}));

export const ML_ACCELS = Object.entries(ML_BACKENDS).map(([value, { label }]) => ({
  value: value as MlAccel,
  label,
}));
