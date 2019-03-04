import {Finder} from "./src/finder";
import chalk from "chalk";
import {Job} from "./src/interfaces/job";

console.log(chalk.blue('Typescript 구인 글 검색 중..'));
(new Finder()).jobs().subscribe((jobs: Job[]) => {
   jobs.forEach(job => {
     console.log(chalk.bold.blue(`${job.name}에서 당신을 애타게 찾고 있어요.`))
     console.log('채용 상세 내용.')
     if ( job.parts ) {
       job.parts.forEach(part => {
         console.log(part.title)
         console.log(part.stat)
       })
     }
   })
});

