import { Result } from '@elastic/elasticsearch/lib/api/types';
import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SearchResultsDTO } from './search.dtos';

export const status = { open: 'open', closed: 'closed' } as const;
export type statusType = (typeof status)[keyof typeof status];

export interface Order {
  restaurantId: number;
  restaurantCity: string;
  restaurantRegion: string;
  proccessTime?: Date;
  orderTime?: Date;
  order: {
    id: number;
    status: statusType;
    statusTime: Date;
    toppings: string[];
  };
}

@Injectable()
export class AppService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async createIndex(order: Order): Promise<Result> {
    console.log('creating index');
    const result = await this.elasticsearchService.index({
      index: 'orders',
      document: order,
      id: String(order.order.id),
    });
    console.log('created index: ', result);
    return result.result;
  }

  isOrderType(order: unknown): order is Order {
    return typeof order === 'object';
  }

  async getSearchResults(
    date: string,
    branch: string,
  ): Promise<SearchResultsDTO[]> {
    const results = await this.elasticsearchService.search({
      index: 'orders',
      body: {
        query: {
          bool: {
            must: [
              { match: { branch: branch } },
              { range: { date: { gte: date, lte: date } } },
            ],
          },
        },
      },
    });
    const ordersMatched = results.hits.hits.map((hit) => {
      if (this.isOrderType(hit._source)) {
        return hit._source;
      }
    });
    const retResults: SearchResultsDTO[] = ordersMatched.reduce(
      (acc, currOrder, index) => {
        const result = {} as SearchResultsDTO;
        result.ingredient1 = currOrder.order.toppings.filter(
          (topping) => topping === 'Olives',
        ).length;
        result.ingredient2 = currOrder.order.toppings.filter(
          (topping) => topping === 'Mushrooms',
        ).length;
        result.ingredient3 = currOrder.order.toppings.filter(
          (topping) => topping === 'Onions',
        ).length;
        result.ingredient4 = currOrder.order.toppings.filter(
          (topping) => topping === 'Corn',
        ).length;
        result.time = currOrder.orderTime;
        result.processTime = currOrder.proccessTime;
        acc.push(result);
        return acc;
      },
      [] as SearchResultsDTO[],
    );
    console.log(ordersMatched);
    console.log(retResults);
    return retResults;
    // return [
    //   {
    //     ingredient1: 4,
    //     ingredient2: 12,
    //     ingredient3: 555,
    //     ingredient4: 64,
    //     amount: 2,
    //     processTime: new Date(),
    //     time: new Date(),
    //   },
    //   {
    //     ingredient1: 424,
    //     ingredient2: 111,
    //     ingredient3: 222,
    //     ingredient4: 333,
    //     amount: 2,
    //     processTime: new Date(),
    //     time: new Date(),
    //   },
    // ];
  }
}
