import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  OnModuleInit,
  Query,
} from '@nestjs/common';
import { AppService, Order, statusType } from './app.service';
import { ConsumerService } from './kafka/consumer.service';
import { SearchResultsDTO } from './search.dtos';

@Controller('/search')
export class AppController implements OnModuleInit {
  constructor(
    private readonly appService: AppService,
    private readonly consumerService: ConsumerService,
  ) {}

  async onModuleInit() {
    await this.consumerService.consume(
      [
        { topic: 'new-order' },
        { topic: 'restaurant-status-change' },
        { topic: 'order-status-change' },
      ],
      {
        eachMessage: async ({ topic, message }) => {
          if (topic == 'restaurant-status-change') {
          } else if (topic == 'order-status-change') {
            const temp = message.value.toString();
            const myObject = JSON.parse(temp);
            const myArray = Object.values(myObject);
            const kafkaUpdateOrder: Order = {
              restaurantId: parseInt(myArray[0].toString()),
              restaurantCity: myArray[1].toString(),
              restaurantRegion: myArray[2].toString(),
              order: myArray[3] as {
                id: number;
                status: statusType;
                statusTime: Date;
                toppings: string[];
              },
            };
            this.appService.updateOrder(
              kafkaUpdateOrder.restaurantId,
              kafkaUpdateOrder.order.id,
            );
          } else if (topic == 'new-order') {
            const temp = message.value.toString();
            const myObject = JSON.parse(temp);
            const myArray = Object.values(myObject);
            const kafkaNewOrder: Order = {
              restaurantId: parseInt(myArray[0].toString()),
              restaurantCity: myArray[1].toString(),
              restaurantRegion: myArray[2].toString(),
              order: myArray[3] as {
                id: number;
                status: statusType;
                statusTime: Date;
                toppings: string[];
              },
            };
            kafkaNewOrder.order.statusTime = new Date(
              kafkaNewOrder.order.statusTime,
            );
            this.appService.createIndex(kafkaNewOrder);
          }
        },
      },
    );
  }

  @Get('/')
  async getSearchResults(
    @Query('date') date: string,
    @Query('branch') branch: string,
  ): Promise<SearchResultsDTO[]> {
    if (!date || !branch)
      throw new HttpException(
        'Please provide date and branch to search',
        HttpStatus.BAD_REQUEST,
      );
    return await this.appService.getSearchResults(date, branch);
  }
}
