import fs from 'fs';

function addKeys(filePath: string, newKeys: Record<string, string>) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const lastBraceIndex = lines.findIndex(line => line.trim() === '};');
  
  const newLines = [...lines.slice(0, lastBraceIndex)];
  for (const [key, value] of Object.entries(newKeys)) {
    newLines.push(`  ${key}: "${value}",`);
  }
  newLines.push(...lines.slice(lastBraceIndex));
  
  fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
}

addKeys('src/locales/en.ts', {
  tasksTitle: "Tasks",
  manageTasksDescription: "Manage your daily tasks and priorities.",
  addTask: "Add Task",
  totalTasks: "Total Tasks",
  pendingTasks: "Pending Tasks",
  completedTasks: "Completed Tasks",
  overdueTasks: "Overdue Tasks",
});

addKeys('src/locales/fr.ts', {
  tasksTitle: "Tâches",
  manageTasksDescription: "Gérez vos tâches quotidiennes et priorités.",
  addTask: "Ajouter une tâche",
  totalTasks: "Tâches Totales",
  pendingTasks: "Tâches en Attente",
  completedTasks: "Tâches Terminées",
  overdueTasks: "Tâches en Retard",
});
