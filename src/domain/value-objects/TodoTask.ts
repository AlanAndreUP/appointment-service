export class TodoTask {
  private readonly _value: string;

  constructor(value: string) {
    this.validate(value);
    this._value = value.trim();
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('La tarea no puede estar vacía');
    }

    if (value.trim().length > 1000) {
      throw new Error('La tarea no puede exceder 1000 caracteres');
    }
  }

  static fromString(value: string): TodoTask {
    return new TodoTask(value);
  }

  static empty(): TodoTask | undefined {
    return undefined;
  }

  get value(): string {
    return this._value;
  }

  isEmpty(): boolean {
    return this._value.length === 0;
  }

  getWordCount(): number {
    return this._value.split(/\s+/).filter(word => word.length > 0).length;
  }

  getCharacterCount(): number {
    return this._value.length;
  }

  equals(other: TodoTask): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

export class TodoList {
  private readonly _pendingTask?: TodoTask;
  private readonly _completedTask?: TodoTask;

  constructor(pendingTask?: TodoTask, completedTask?: TodoTask) {
    this._pendingTask = pendingTask;
    this._completedTask = completedTask;
  }

  static create(pendingTask?: string, completedTask?: string): TodoList {
    return new TodoList(
      pendingTask ? TodoTask.fromString(pendingTask) : undefined,
      completedTask ? TodoTask.fromString(completedTask) : undefined
    );
  }

  static empty(): TodoList {
    return new TodoList();
  }

  get pendingTask(): TodoTask | undefined {
    return this._pendingTask;
  }

  get completedTask(): TodoTask | undefined {
    return this._completedTask;
  }

  hasPendingTask(): boolean {
    return this._pendingTask !== undefined;
  }

  hasCompletedTask(): boolean {
    return this._completedTask !== undefined;
  }

  updatePendingTask(task: string): TodoList {
    return new TodoList(
      TodoTask.fromString(task),
      this._completedTask
    );
  }

  updateCompletedTask(task: string): TodoList {
    return new TodoList(
      this._pendingTask,
      TodoTask.fromString(task)
    );
  }

  markAsCompleted(completedTask: string): TodoList {
    return new TodoList(
      this._pendingTask,
      TodoTask.fromString(completedTask)
    );
  }

  clearPendingTask(): TodoList {
    return new TodoList(
      undefined,
      this._completedTask
    );
  }

  clearCompletedTask(): TodoList {
    return new TodoList(
      this._pendingTask,
      undefined
    );
  }

  equals(other: TodoList): boolean {
    const pendingEquals = this._pendingTask && other._pendingTask ? 
      this._pendingTask.equals(other._pendingTask) : 
      this._pendingTask === other._pendingTask;
    
    const completedEquals = this._completedTask && other._completedTask ? 
      this._completedTask.equals(other._completedTask) : 
      this._completedTask === other._completedTask;
    
    return pendingEquals && completedEquals;
  }

  toJSON() {
    return {
      to_do: this._pendingTask?.value,
      finish_to_do: this._completedTask?.value
    };
  }
} 