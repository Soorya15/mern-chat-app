import mongoose from 'mongoose'

//Function to connect to the mongodb database

export const connectDB = async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/chat-app`)
    }
}