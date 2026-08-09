import {Kafka, logLevel} from "kafkajs";

export const kafka  = new Kafka({
    clientId: "kafka-service",

    brokers: ["localhost:9092"],
    ssl: true,
    sasl:{
        mechanism: "plain",
        username: process.env.KAFKA_API_KEY!,
        password: process.env.KAFKA_API_SECRET!,
    },
    connectionTimeout: 30000,
    authenticationTimeout: 15000,
    requestTimeout: 25000,
    retry:{
        retries: 8,
        initialRetryTime: 300,
        factor:2,
    },
    logLevel: logLevel.INFO,
})