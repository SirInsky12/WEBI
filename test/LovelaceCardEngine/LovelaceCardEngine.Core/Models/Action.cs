using System;
using LovelaceCardEngine.Core.Services;

namespace LovelaceCardEngine.Core.Models
{
    public class Action
    {
        public string Type { get; set; } = "tap"; // tap, hold, double_tap
        public string ActionType { get; set; } = "toggle"; // toggle, more-info, navigate, call-service
        public string? Target { get; set; } // Entity ID for toggle, URL for navigate
        public string? NavigateTo { get; set; } // URL for navigate action
        public string? Service { get; set; } // service domain.service
        public Dictionary<string, object>? ServiceData { get; set; }
        public int? Debounce { get; set; } = 500; // milliseconds
    }

    public class ActionExecutionContext
    {
        public Action Action { get; set; }
        public Entity? Entity { get; set; }
        public IEntityStore EntityStore { get; set; }

        public ActionExecutionContext(Action action, Entity? entity, IEntityStore store)
        {
            Action = action;
            Entity = entity;
            EntityStore = store;
        }
    }
}
