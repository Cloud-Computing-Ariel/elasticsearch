import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ElasticsearchModule.register({
      node: 'http://elasticsearch:9200',
    }),
    ClientsModule.register([
      {
        name: 'ELASTIC_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'pizza',
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'nestjs-kafka',
          },
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private readonly appService: AppService) {}
}
