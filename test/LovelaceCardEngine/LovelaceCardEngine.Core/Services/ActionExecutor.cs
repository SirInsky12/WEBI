using System;
using LovelaceCardEngine.Core.Models;

namespace LovelaceCardEngine.Core.Services
{
    /// <summary>
    /// Executes actions (toggle, more-info, navigate, call-service)
    /// </summary>
    public interface IActionExecutor
    {
        Task ExecuteAsync(ActionExecutionContext context);
    }

    public class ActionExecutor : IActionExecutor
    {
        private readonly IEntityStore _entityStore;

        public ActionExecutor(IEntityStore entityStore)
        {
            _entityStore = entityStore;
        }

        public async Task ExecuteAsync(ActionExecutionContext context)
        {
            var action = context.Action;

            switch (action.ActionType?.ToLower())
            {
                case "toggle":
                    ExecuteToggle(context);
                    break;
                case "more-info":
                    ExecuteMoreInfo(context);
                    break;
                case "navigate":
                    ExecuteNavigate(context);
                    break;
                case "call-service":
                    await ExecuteCallServiceAsync(context);
                    break;
                default:
                    throw new ArgumentException($"Unknown action type: {action.ActionType}");
            }

            await Task.CompletedTask;
        }

        private void ExecuteToggle(ActionExecutionContext context)
        {
            var entity = context.Entity;
            if (entity == null) return;

            // For toggle, switch new state based on type
            object newState = entity.EntityType switch
            {
                "light" or "switch" => !(bool)entity.State,
                "cover" => entity.State?.ToString() == "open" ? "closed" : "open",
                _ => entity.State
            };

            _entityStore.UpdateEntityState(entity.Id, newState);
            Console.WriteLine($"Toggled {entity.Id}: {entity.State} → {newState}");
        }

        private void ExecuteMoreInfo(ActionExecutionContext context)
        {
            Console.WriteLine($"More info for {context.Entity?.Id}");
            // In UI, this would open a detailed dialog
        }

        private void ExecuteNavigate(ActionExecutionContext context)
        {
            Console.WriteLine($"Navigate to {context.Action.NavigateTo}");
            // In UI, this would navigate to URL
        }

        private async Task ExecuteCallServiceAsync(ActionExecutionContext context)
        {
            var action = context.Action;
            Console.WriteLine($"Call service: {action.Service}");
            Console.WriteLine($"Service data: {string.Join(", ", action.ServiceData?.Select(kv => $"{kv.Key}={kv.Value}") ?? [])}");
            // In real implementation, would call actual service
            await Task.Delay(100);
        }
    }
}
