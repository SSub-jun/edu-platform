import { Controller, Get } from '@nestjs/common';

@Controller()
export class RootHealthController {
  @Get('/healthz')
  health() {
    return { ok: true };
  }
}



