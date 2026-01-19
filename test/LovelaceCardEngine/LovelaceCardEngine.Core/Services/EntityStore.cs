using System;
using LovelaceCardEngine.Core.Models;

namespace LovelaceCardEngine.Core.Services
{
    /// <summary>
    /// Manages entities and provides subscribe/publish functionality
    /// </summary>
    public interface IEntityStore
    {
        Entity GetEntity(string id);
        IEnumerable<Entity> GetEntities();
        void RegisterEntity(Entity entity);
        void UpdateEntityState(string entityId, object newState);
        IDisposable SubscribeToEntity(string entityId, Action<Entity> callback);
        IDisposable SubscribeToAll(Action<Entity> callback);
    }

    public class EntityStore : IEntityStore
    {
        private readonly Dictionary<string, Entity> _entities = new();
        private readonly Dictionary<string, List<System.Action<Entity>>> _subscribers = new();
        private readonly List<System.Action<Entity>> _globalSubscribers = new();

        public Entity GetEntity(string id)
        {
            if (!_entities.TryGetValue(id, out var entity))
                throw new KeyNotFoundException($"Entity '{id}' not found");
            return entity;
        }

        public IEnumerable<Entity> GetEntities() => _entities.Values;

        public void RegisterEntity(Entity entity)
        {
            _entities[entity.Id] = entity;
            entity.StateChanged += (s, e) => NotifySubscribers(entity);
        }

        public void UpdateEntityState(string entityId, object newState)
        {
            var entity = GetEntity(entityId);
            entity.UpdateState(newState);
        }

        public IDisposable SubscribeToEntity(string entityId, System.Action<Entity> callback)
        {
            if (!_subscribers.ContainsKey(entityId))
                _subscribers[entityId] = new();

            _subscribers[entityId].Add(callback);

            // Return disposable to unsubscribe
            return new Unsubscriber(() => _subscribers[entityId].Remove(callback));
        }

        public IDisposable SubscribeToAll(System.Action<Entity> callback)
        {
            _globalSubscribers.Add(callback);
            return new Unsubscriber(() => _globalSubscribers.Remove(callback));
        }

        private void NotifySubscribers(Entity entity)
        {
            // Notify specific entity subscribers
            if (_subscribers.TryGetValue(entity.Id, out var subscribers))
            {
                foreach (var subscriber in subscribers)
                    subscriber(entity);
            }

            // Notify global subscribers
            foreach (var subscriber in _globalSubscribers)
                subscriber(entity);
        }

        private class Unsubscriber : IDisposable
        {
            private readonly System.Action _unsubscribe;

            public Unsubscriber(System.Action unsubscribe) => _unsubscribe = unsubscribe;

            public void Dispose() => _unsubscribe();
        }
    }
}
