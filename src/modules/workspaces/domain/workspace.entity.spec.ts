import { version } from 'uuid';
import { Workspace } from './workspace.entity';

describe('Workspace', () => {
  it('should create an individual workspace named after its owner, who is its only member', () => {
    const workspace = Workspace.createIndividual({
      id: 'user-1',
      name: 'Ana Souza',
    });

    expect(version(workspace.id)).toBe(7);
    expect(workspace.type).toBe('INDIVIDUAL');
    expect(workspace.name).toBe('Ana Souza');
    expect(workspace.individualOwnerId).toBe('user-1');
    expect(workspace.members).toEqual([{ userId: 'user-1', role: 'OWNER' }]);
    expect(workspace.active).toBe(true);
  });
});
