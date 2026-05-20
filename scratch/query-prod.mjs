import { createClient } from '@supabase/supabase-js';

const url = 'https://vkyhvfclwjidvutwryay.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZreWh2ZmNsd2ppZHZ1dHdyeWF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTAwNTI2OCwiZXhwIjoyMDk0NTgxMjY4fQ.OEYFFtY8wiquvL4ZPlcDWafeXgHdScSAB76CCLZDtaU';
const supabase = createClient(url, key);

async function query() {
  const { data, error } = await supabase
    .from('challenges')
    .select('*');

  if (error) {
    console.error("Error querying challenges:", error);
  } else {
    console.log(`Found ${data.length} challenges:`);
    data.forEach(c => {
      console.log(`ID: ${c.id}, Date: ${c.set_date}, Order: ${c.set_order}, Answer: ${c.answer}, URL: ${c.image_url}`);
    });
  }
}

query().catch(console.error);
