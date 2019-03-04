import {JobPart} from "./job-part";

export interface Job
{
   readonly name: string;
   readonly parts?: JobPart[];
   readonly description?: string;
   readonly pay?: number;
}