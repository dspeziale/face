export type UserRole = 'ADMIN' | 'OPERATOR' | 'WORKER' | 'HOUSEKEEPER'
export type ActivityStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type ActivityType = 'MAINTENANCE' | 'LAUNDRY' | 'CLEANING' | 'EMERGENCY' | 'INSPECTION' | 'OTHER'

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Amministratore',
  OPERATOR: 'Operatore',
  WORKER: 'Operaio',
  HOUSEKEEPER: 'Cameriera'
}

export const STATUS_LABELS: Record<ActivityStatus, string> = {
  PENDING: 'In Attesa',
  IN_PROGRESS: 'In Corso',
  COMPLETED: 'Completata',
  CANCELLED: 'Annullata'
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Bassa',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente'
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  MAINTENANCE: 'Manutenzione',
  LAUNDRY: 'Biancheria',
  CLEANING: 'Pulizia',
  EMERGENCY: 'Emergenza',
  INSPECTION: 'Ispezione',
  OTHER: 'Altro'
}

export const STATUS_COLORS: Record<ActivityStatus, string> = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger'
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: 'secondary',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'danger'
}
