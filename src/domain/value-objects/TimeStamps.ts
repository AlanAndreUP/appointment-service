export class TimeStamps {
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;
  private readonly _deletedAt?: Date;

  constructor(createdAt: Date, updatedAt: Date, deletedAt?: Date) {
    this.validate(createdAt, updatedAt, deletedAt);
    this._createdAt = new Date(createdAt);
    this._updatedAt = new Date(updatedAt);
    this._deletedAt = deletedAt ? new Date(deletedAt) : undefined;
  }

  private validate(createdAt: Date, updatedAt: Date, deletedAt?: Date): void {
    if (!createdAt || isNaN(createdAt.getTime())) {
      throw new Error('La fecha de creación no es válida');
    }

    if (!updatedAt || isNaN(updatedAt.getTime())) {
      throw new Error('La fecha de actualización no es válida');
    }

    if (updatedAt < createdAt) {
      throw new Error('La fecha de actualización no puede ser anterior a la fecha de creación');
    }

    if (deletedAt && isNaN(deletedAt.getTime())) {
      throw new Error('La fecha de eliminación no es válida');
    }

    if (deletedAt && deletedAt < createdAt) {
      throw new Error('La fecha de eliminación no puede ser anterior a la fecha de creación');
    }
  }

  static create(): TimeStamps {
    const now = new Date();
    return new TimeStamps(now, now);
  }

  static fromDates(createdAt: Date, updatedAt: Date, deletedAt?: Date): TimeStamps {
    return new TimeStamps(createdAt, updatedAt, deletedAt);
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  get deletedAt(): Date | undefined {
    return this._deletedAt ? new Date(this._deletedAt) : undefined;
  }

  isDeleted(): boolean {
    return this._deletedAt !== undefined;
  }

  markAsUpdated(): TimeStamps {
    return new TimeStamps(
      this._createdAt,
      new Date(),
      this._deletedAt
    );
  }

  markAsDeleted(): TimeStamps {
    return new TimeStamps(
      this._createdAt,
      new Date(),
      new Date()
    );
  }

  getDaysSinceCreation(): number {
    const now = new Date();
    const diffTime = now.getTime() - this._createdAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  getHoursSinceLastUpdate(): number {
    const now = new Date();
    const diffTime = now.getTime() - this._updatedAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60));
  }

  wasRecentlyUpdated(hoursThreshold: number = 1): boolean {
    return this.getHoursSinceLastUpdate() <= hoursThreshold;
  }

  equals(other: TimeStamps): boolean {
    return (
      this._createdAt.getTime() === other._createdAt.getTime() &&
      this._updatedAt.getTime() === other._updatedAt.getTime() &&
      this._deletedAt?.getTime() === other._deletedAt?.getTime()
    );
  }

  toJSON() {
    return {
      created_at: this._createdAt,
      updated_at: this._updatedAt,
      deleted_at: this._deletedAt
    };
  }
} 