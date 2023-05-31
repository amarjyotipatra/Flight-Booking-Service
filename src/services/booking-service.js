const axios=require('axios');
const { BookingRepository }=require('../repositories')
const { ServerConfig }=require('../config')
const db=require('../models');
const AppError = require('../utils/errors/app-error');
const { StatusCodes } = require('http-status-codes');
const {Enums} = require('../utils/common');
const { BOOKED, CANCELLED,} = Enums.BOOKING_STATUS;

const bookingRepository=new BookingRepository();

async function createBooking(data){
    const transaction=await db.sequelize.transaction();
    try {
        const flight=await axios.get(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}`);
             if(data.noofSeats > flight.data.data.totalSeats){
                 throw new AppError('Not enough seats available',StatusCodes.BAD_REQUEST);
             }
             const totalBillingAmount=data.noofSeats * flight.data.data.price;
             const bookingPayload={...data,totalCost:totalBillingAmount};
             const booking=await bookingRepository.create(bookingPayload,transaction);
             await axios.patch(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}/seats`,{
                seats:data.noofSeats,
             })
             await transaction.commit();
             return booking; 
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function makePayment(data){
    const transaction=await db.sequelize.transaction();
    try {
        const bookingDetails=await bookingRepository.get(data.bookingId);
        if(bookingDetails.status==CANCELLED){
            throw new AppError('Booking already cancelled',StatusCodes.BAD_REQUEST);
        }
        const bookingTime=new Date(bookingDetails.createdAt);
        const currentTime=new Date();
        if(bookingTime-currentTime >300000){
            await cancelBooking(data.bookingId);
            throw new AppError('Booking has expired',StatusCodes.BAD_REQUEST)
        }
        if(bookingDetails.totalCost != data.totalCost){
          throw new AppError('The amount of payment is wrong',StatusCodes.BAD_REQUEST)
        }
        if(bookingDetails.userId != data.userId){
            throw new AppError('Wrong UserId',StatusCodes.BAD_REQUEST); 
        }
        //We assume here that payment is successful
        await bookingRepository.update(data.bookingId,{status : BOOKED},transaction);
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
 
async function cancelBooking(bookingId){
    const transaction=await db.sequelize.transaction();
    try {
        const bookingDetails=await bookingRepository.get(bookingId,transaction);
        if(bookingDetails.status==CANCELLED){
            await transaction.commit();
            return true;
        }
        await axios.patch(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${bookingDetails.flightId}/seats`,{
            seats:bookingDetails.totalSeats,
            dec:false,
         })
         await bookingRepository.update(bookingId,{status:CANCELLED},transaction);
         await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function cancelOldBookings(){
   try {
    const time=new Date(Date.now()-1000*60*5); //5 mins ago
    const response=await bookingRepository.cancelOldBookings(time);
    return response;
   } catch (error) {
      console.log(error)
   }
}

module.exports = {
    createBooking,
    makePayment,
    cancelBooking,
    cancelOldBookings,
}