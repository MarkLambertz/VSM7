import { createApiWorkspaceRepository } from "./apiWorkspaceRepository.js";
import { createLocalStorageRepository } from "./localStorageRepository.js";

export async function createWorkspaceRepository() {
  const localRepository = createLocalStorageRepository();

  try {
    return createApiWorkspaceRepository(localRepository);
  } catch {
    return localRepository;
  }
}
