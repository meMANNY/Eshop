import {Kafka, logLevel} from "kafkajs";

export const kafka  = new Kafka({
    clientId: "kafka-service",

    /*
      The broker was hardcoded to one Confluent cluster, which pinned every
      deployment to that account with no way to point at another environment.
      Comma-separated so a multi-broker cluster can be configured, and the old
      value stays the default so nothing changes locally.
    */
    brokers: process.env.KAFKA_BROKER?.split(",").map((b) => b.trim()) || [
        "pkc-41p56.asia-south1.gcp.confluent.cloud:9092",
    ],
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