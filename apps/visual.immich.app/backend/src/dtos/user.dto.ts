import type { UserRole } from '../enum';

export type UserResponseDto = { id: string; email: string; name: string; role: UserRole };
