const cron=require('node-cron');
const { BookingService }=require('../../services')

function scheduleCrons(){
cron.schedule('*/30 * * * * *',async ()=>{
    console.log('node-cron scheduling every minute',BookingService);
    await BookingService.cancelOldBookings();
})
}

module.exports=scheduleCrons;