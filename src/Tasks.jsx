import React, { useEffect, useState } from 'react';
import { PlusCircle, MoreVertical, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const Tasks = ({ socket }) => {
  const [tasks, setTasks] = useState({
    pending: [
      { id: 1, title: 'Research competitor products', description: 'Analyze top 3 competitors', priority: 'High' },
      { id: 2, title: 'Update documentation', description: 'Add new API endpoints', priority: 'Medium' },
    ],
    working: [
      { id: 3, title: 'Fix navigation bug', description: 'Mobile menu not closing', priority: 'High' },
    ],
    completed: [
      { id: 4, title: 'Design review', description: 'Review homepage mockups', priority: 'Low' },
    ],
  });

  const [editing, setEditing] = useState({ id: null, field: null });

  useEffect(() => {
    socket.on('initial:state', (initialTasks) => {
      setTasks(initialTasks);
    });

    socket.on('task:move', (data) => {
      setTasks(prev => {
        const { taskId, targetColumn } = data;
        console.log(taskId, targetColumn);
        let foundTask;
        for (let status in prev) {
          console.log(status)
          for (let task of prev[status]) {
            console.log(task)
            if (task.id === taskId) {
              foundTask = {
                status, task
              };
              console.log(foundTask)
            }
          }
        }
        let sourceColumn = foundTask.status;
        if (sourceColumn === targetColumn)
          return prev;

        return {
          ...prev,
          [sourceColumn]: prev[sourceColumn].filter(t => t.id !== taskId),
          [targetColumn]: [...prev[targetColumn], foundTask.task],
        }
      });
    });

    socket.on('task:edit', data => {
      const { status, field, value, taskId } = data;
      setTasks(prev => {
        return {
          ...prev,
          [status]: prev[status].map(task => {
            if (task.id === taskId) {
              task[field] = value;
            }
            return task;
          })
        }
      })
    })

    return () => {
      socket.off('task:move');
      socket.off('initial:state');
      socket.off('task:edit');
    };
  }, [socket]);

  const handleEdit = (status, taskId, field, value) => {
    setTasks(prev => {
      const updatedTasks = { ...prev };
      const taskIndex = updatedTasks[status].findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        updatedTasks[status][taskIndex] = {
          ...updatedTasks[status][taskIndex],
          [field]: value
        };
      }
      return updatedTasks;
    });
  };

  const handleKeyDown = (e, status, taskId, field, value) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      handleEdit(status, taskId, field, value);
      setEditing({ id: null, field: null });
    }
  };

  const handleDragStart = (e, taskId, sourceColumn) => {
    if (editing.id) return;
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.setData('sourceColumn', sourceColumn);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetColumn) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    let foundTask;
    for (let status in tasks) {
      for (let task of tasks[status]) {
        if (task.id === taskId) {
          foundTask = {
            status, task
          };
        }
      }
    }
    let sourceColumn = foundTask.status;

    console.log(taskId, sourceColumn, targetColumn);

    if (sourceColumn === targetColumn) return;

    socket.emit('task:move', { taskId, targetColumn });

    setTasks(prev => {
      const task = prev[sourceColumn].find(t => t.id === taskId);
      return {
        ...prev,
        [sourceColumn]: prev[sourceColumn].filter(t => t.id !== taskId),
        [targetColumn]: [...prev[targetColumn], task],
      };
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getColumnStyles = (status) => {
    switch (status) {
      case 'pending':
        return {
          container: 'bg-orange-50 border-t-4 border-orange-400',
          header: 'text-orange-700',
          icon: <Clock className="mr-2 text-orange-500" size={20} />,
          button: 'hover:bg-orange-100 text-orange-600 hover:text-orange-700',
          count: 'bg-orange-100 text-orange-600',
        };
      case 'working':
        return {
          container: 'bg-blue-50 border-t-4 border-blue-400',
          header: 'text-blue-700',
          icon: <Loader2 className="mr-2 text-blue-500" size={20} />,
          button: 'hover:bg-blue-100 text-blue-600 hover:text-blue-700',
          count: 'bg-blue-100 text-blue-600',
        };
      case 'completed':
        return {
          container: 'bg-green-50 border-t-4 border-green-400',
          header: 'text-green-700',
          icon: <CheckCircle2 className="mr-2 text-green-500" size={20} />,
          button: 'hover:bg-green-100 text-green-600 hover:text-green-700',
          count: 'bg-green-100 text-green-600',
        };
      default:
        return {
          container: 'bg-gray-50',
          header: 'text-gray-700',
          icon: null,
          button: 'hover:bg-gray-100',
          count: 'bg-gray-100 text-gray-600',
        };
    }
  };

  const onChangeTitleOrDescription = (status, taskId, field, value) => {
    setTasks(prev => {
      const updatedTasks = { ...prev };
      const taskIndex = updatedTasks[status].findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        updatedTasks[status][taskIndex] = {
          ...updatedTasks[status][taskIndex],
          [field]: value
        };
      }
      return updatedTasks;
    });

    socket.emit('task:edit', { status, taskId, field, value });
  };

  const Column = ({ title, tasks, status }) => {
    const styles = getColumnStyles(status);

    return (
      <div
        className={`flex flex-col w-96 rounded-lg p-4 ${styles.container}`}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, status)}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {styles.icon}
            <h3 className={`font-semibold ${styles.header}`}>{title}</h3>
          </div>
          <span className={`rounded-full px-2 py-1 text-sm ${styles.count}`}>
            {tasks.length}
          </span>
        </div>

        <div className="space-y-3">
          {tasks.map(task => (
            <Card
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task.id, status)}
              className="bg-white cursor-move hover:shadow-md transition-shadow"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  {editing.id === task.id && editing.field === 'title' ? (
                    <input
                      type="text"
                      className="flex-1 p-1 text-sm font-medium border rounded"
                      defaultValue={task.title}
                      autoFocus
                      onChange={(e) => {
                        onChangeTitleOrDescription(status, task.id, 'title', e.target.value);
                      }}
                      onBlur={(e) => {
                        setEditing({ id: null, field: null });
                      }}
                      onKeyDown={(e) => handleKeyDown(e, status, task.id, 'title', e.target.value)}
                    />
                  ) : (
                    <CardTitle
                      className="text-sm font-medium cursor-pointer hover:text-blue-600"
                      onClick={() => setEditing({ id: task.id, field: 'title' })}
                    >
                      {task.title}
                    </CardTitle>
                  )}
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {editing.id === task.id && editing.field === 'description' ? (
                  <input
                    type="text"
                    className="w-full p-1 text-sm border rounded mb-2"
                    defaultValue={task.description}
                    onChange={(e) => {
                      onChangeTitleOrDescription(status, task.id, 'description', e.target.value);
                    }}
                    autoFocus
                    onBlur={(e) => {
                      setEditing({ id: null, field: null });
                    }}
                    onKeyDown={(e) => handleKeyDown(e, status, task.id, 'description', e.target.value)}
                  />
                ) : (
                  <p
                    className="text-sm text-gray-500 mb-2 cursor-pointer hover:text-blue-600"
                    onClick={() => setEditing({ id: task.id, field: 'description' })}
                  >
                    {task.description}
                  </p>
                )}
                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <button className={`mt-4 flex items-center text-sm ${styles.button} rounded-md p-2`}>
          <PlusCircle size={16} className="mr-1" />
          Add task
        </button>
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Project Tasks</h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <PlusCircle size={16} className="mr-2" />
          New Task
        </button>
      </div>

      <div className="flex gap-16 justify-center">
        <Column title="Pending" tasks={tasks.pending} status="pending" />
        <Column title="In Progress" tasks={tasks.working} status="working" />
        <Column title="Completed" tasks={tasks.completed} status="completed" />
      </div>
    </div>
  );
};

export default Tasks;