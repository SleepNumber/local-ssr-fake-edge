const printLCP = process.argv.indexOf('--lcp') !== -1;

const lcpPrinter = printLCP
  ? `
<script>
  new PerformanceObserver(entryList => {
    for (const entry of entryList.getEntries()) {
      console.log('LCP candidate:', entry.startTime, entry);
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true });
</script>
`
  : '';

export default lcpPrinter;
