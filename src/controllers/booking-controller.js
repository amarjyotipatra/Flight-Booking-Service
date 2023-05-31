const { StatusCodes } = require('http-status-codes');
const { BookingService }=require('../services');
const { SuccessResponse,ErrorResponse }=require('../utils/common')

async function createBooking(req,res){
    try {
        const response=BookingService.createBooking({
            flightId:req.body.flightId,
            userId : req.body.userId,
            noofSeats : req.body.noofSeats,
        })
        SuccessResponse.data=response;
        return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error=error;
        return res.status(error.StatusCodes).json(ErrorResponse);
    }
}

async function makePayment(data){
    try {
        const response=await BookingService.makePayment({
            totalCost:req.body.totalCost,
            bookingId:req.body.bookingId,
            userId:req.body.userId,
        });
        SuccessResponse.data=response;
        return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error=error;
        return res.status(error.StatusCodes).json(ErrorResponse);
    }
}

module.exports = {
    createBooking,
    makePayment,
}