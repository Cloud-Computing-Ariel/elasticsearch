import { Result } from '@elastic/elasticsearch/lib/api/types';
import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import * as moment from 'moment';
import { SearchResultsDTO } from './search.dtos';

export const status = { open: 'open', closed: 'closed' } as const;
export type statusType = (typeof status)[keyof typeof status];

export interface Order {
  restaurantId: number;
  restaurantCity: string;
  restaurantRegion: string;
  proccessTime?: number;
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
    order.orderTime = order.order.statusTime;
    try {
      const result = await this.elasticsearchService.index({
        index: 'orders',
        document: order,
        refresh: true,
        id: String(order.order.id),
      });
      return result.result;
    } catch (err) {
      console.log(err);
    }
  }

  isOrderType(order: unknown): order is Order {
    return typeof order === 'object';
  }

  async updateOrder(restaurantId: number, orderId: number) {
    const results = await this.elasticsearchService.search({
      index: 'orders',
      query: {
        match: {
          restaurantId: restaurantId,
        },
      },
    });
    const ordersMatched = results.hits.hits.map((hit) => {
      if (this.isOrderType(hit._source)) {
        return hit._source;
      }
    });
    const currOrder = ordersMatched.find((order) => order.order.id === orderId);
    if(!currOrder){
      return currOrder
    }
    currOrder.proccessTime = moment().diff(currOrder.orderTime);
    
    console.log(currOrder);
    const res = await this.elasticsearchService.update({
      index: 'orders',
      id: String(currOrder.restaurantId),
      doc: currOrder,
    });
    
  
    return res;
  }

  async getSearchResults(
    date: string,
    branch: string,
  ): Promise<SearchResultsDTO[]> {
    const formattedDate = moment(
      `${date.split('/')[2]}${date.split('/')[1]}${date.split('/')[0]}`,
    ).toDate();

    const results = await this.elasticsearchService.search({
      index: 'orders',
      query: {
        bool: {
          must: [
            { match: { restaurantCity: branch } },
            {
              range: {
                orderTime: {
                  gte: formattedDate.toISOString(),
                },
              },
            },
          ],
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
    console.log('ordersMatched: ', ordersMatched);
    console.log('retResults: ', retResults);
    return retResults;
  }
}
