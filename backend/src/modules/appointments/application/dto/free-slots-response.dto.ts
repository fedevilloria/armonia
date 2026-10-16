export class FreeSlotDto {
  startTime!: string;
  endTime!: string;
  duration!: number;
}

export class FreeSlotsResponseDto {
  date!: string;
  slots!: FreeSlotDto[];
}
