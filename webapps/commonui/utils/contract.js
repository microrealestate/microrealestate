import moment from 'moment';

export function contractEndMoment(beginMoment, lease) {
  return durationEndMoment(
    beginMoment,
    moment.duration(lease.numberOfTerms, lease.timeRange)
  );
}

export function durationEndMoment(beginMoment, durationMoment) {
  return beginMoment.add(durationMoment).subtract(1, 'second');
}
