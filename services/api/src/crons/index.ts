import { start as startRenewContractJob } from './renewcontractjob';

export default function startCronJobs() {
  startRenewContractJob();
}
