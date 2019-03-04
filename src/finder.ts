import axios, {AxiosResponse} from 'axios';
import  * as cheerio from 'cheerio';
import chalk from "chalk";
import {forkJoin, from, Observable, of} from "rxjs/index";
import {combineAll, concatMap, map, mergeAll, mergeMap, tap, zip} from "rxjs/internal/operators";
import {Job} from "./interfaces/job";
import {JobPart} from "./interfaces/job-part";

export enum JobServices {
  RocketPunch = 'https://www.rocketpunch.com/api/jobs/template?keywords=typescript',
  Wanted = 'https://www.wanted.co.kr/search?query=typescript'
}

export class Finder<T> {
  public parsingEndPoints: string[] = [
    JobServices.RocketPunch
  ];

  public jobs(): Observable<Job[]>
  {
    return from(forkJoin(this.parsingEndPoints.map((endPoint: string) => {
      return from(this.getPageRange(endPoint)).pipe(
        concatMap((pageRange: number[]) => {
          return (pageRange[0] === pageRange[1]) ? axios.get(endPoint) : forkJoin(Array.from(Array(Number(pageRange[1])).keys()).map((seqNumber: number) => {
            return from(axios.get(`${endPoint}&page=${seqNumber+1}`));
          }));
        })
      )
    })).pipe(
      concatMap((responses: any) => {
        return of(responses.map((res: AxiosResponse[]) => res.map((r: AxiosResponse) => this.reformat(r)))).pipe(mergeAll())
      }),
      map((j: any) => j.reduce((r:any, e:any) => (r.push(...e), r), []))
    ))
  }

  public getPageRange(endPoint: string): Observable<number[]>
  {
    return from(axios.get(endPoint)).pipe(
      concatMap((responseBody: AxiosResponse) => {
        const $: CheerioStatic = cheerio.load(responseBody.data.data.template);
        const pagination: any = $('.pagination .mobile.only a.item:not(data-query-add)').map((index: number, paginationEle: CheerioElement) => {
          return [$(paginationEle).first().text(), $(paginationEle).last().text()];
        });
        return of([pagination.get([0]), pagination.slice(-1)[0]]);
      })
    )
  }

  public reformat(responseBody: AxiosResponse): Job[]
  {
    const $: CheerioStatic = cheerio.load(responseBody.data.data.template);
    const rows: Cheerio = ($('#company-list > div.item').not('.job-ad-group').map((index: number, companyEle: CheerioElement) => {
      const jobParts: JobPart[] = [];
      $(companyEle).find('.company-job').map((index: number, jobDetailEle: CheerioElement) => {
        jobParts.push({
          title: $(jobDetailEle).find('.job-title').text(),
          stat: $(jobDetailEle).find('.job-stat-info').text()
        })
      });

      return {
        name: $(companyEle).find('.company-name strong').text(),
        parts: jobParts
      }
    }));

    return rows.get();
  }
}