export interface Skill {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  isActive: boolean;
}

export interface CreateSkillRequest {
  name: string;
  description: string;
  categoryId: string;
  isActive: boolean;
}

export interface UpdateSkillRequest extends Partial<CreateSkillRequest> { }
