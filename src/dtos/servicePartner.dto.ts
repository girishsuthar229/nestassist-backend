import { ServicePartner, User } from "@/models";
import { Gender, Proficiency } from "../enums/servicePartner.enum";
import { 
  IPartnerEducation, 
  IPartnerExperience, 
  IPartnerLanguage 
} from "../interfaces/servicePartner.interface";

export interface RegisterServicePartnerDto {
  fullName: string;
  email: string;
  dob: string;
  gender: Gender;
  mobile: string;
  applyingFor: number[];
  permanentAddress?: string;
  residentialAddress?: string;
  
  education: IPartnerEducation[];
  professional?: IPartnerExperience[];
  skills: number[]; // Category IDs
  servicesOffered: number[]; // SubCategory IDs
  languages: IPartnerLanguage[];
}

export interface ServicePartnerFilesDto {
  profileImage?: { path: string; cloudinaryId?: string }[];
  attachments?: { path: string; originalname?: string; size?: string; cloudinaryId?: string }[];
}

export type ServicePartnerWithUser = ServicePartner & {
  user?: User;
};