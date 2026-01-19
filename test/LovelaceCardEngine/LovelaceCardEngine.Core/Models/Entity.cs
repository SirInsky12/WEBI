using System;

namespace LovelaceCardEngine.Core.Models
{
    /// <summary>
    /// Represents an entity (light, switch, sensor, etc.)
    /// </summary>
    public class Entity
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string EntityType { get; set; } // "light", "switch", "sensor", etc.
        public object State { get; set; }
        public Dictionary<string, object> Attributes { get; set; } = new();
        public DateTime LastUpdated { get; set; }
        public string? Icon { get; set; }
        public string? Unit { get; set; }
        public bool IsAvailable { get; set; } = true;

        public event EventHandler<EntityStateChangedEventArgs>? StateChanged;

        public void UpdateState(object newState, Dictionary<string, object>? attributes = null)
        {
            var oldState = State;
            State = newState;
            LastUpdated = DateTime.UtcNow;
            
            if (attributes != null)
                Attributes = attributes;

            StateChanged?.Invoke(this, new EntityStateChangedEventArgs(oldState, newState));
        }

        public override string ToString() => $"{Id}: {State}";
    }

    public class EntityStateChangedEventArgs : EventArgs
    {
        public object? OldState { get; }
        public object NewState { get; }

        public EntityStateChangedEventArgs(object? oldState, object newState)
        {
            OldState = oldState;
            NewState = newState;
        }
    }
}
