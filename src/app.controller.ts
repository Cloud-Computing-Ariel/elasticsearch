import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  OnModuleInit,
  Query,
} from '@nestjs/common';
import { ClientKafka, MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { SearchResultsDTO } from './search.dtos';

@Controller('/search')
export class AppController implements OnModuleInit {
  constructor(
    private readonly appService: AppService,
    @Inject('ELASTIC_SERVICE') private readonly client: ClientKafka,
  ) {}

  async onModuleInit() {
    this.client.subscribeToResponseOf('pizza');
    // await this.client.connect();
  }

  @MessagePattern('pizza')
  killDragon(@Payload() message: any): any {
    console.log(message);
    return 123;
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
