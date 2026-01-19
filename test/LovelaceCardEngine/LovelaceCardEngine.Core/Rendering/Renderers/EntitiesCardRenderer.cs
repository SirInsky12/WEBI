using System;
using LovelaceCardEngine.Core.Models;
using LovelaceCardEngine.Core.Services;
using LovelaceCardEngine.Core.Rendering;

namespace LovelaceCardEngine.Core.Rendering.Renderers
{
    /// <summary>
    /// Renders entities card
    /// </summary>
    public class EntitiesCardRenderer : ICardRenderer
    {
        public bool CanRender(string cardType) => cardType == "entities";

        public RenderedCard Render(CardConfig config, IEntityStore entityStore)
        {
            var entitiesConfig = config as EntitiesCardConfig
                ?? throw new ArgumentException("Invalid entities card config");

            var html = "<div class='entities-card'>";
            
            if (!string.IsNullOrEmpty(entitiesConfig.Title))
                html += $"<h3>{entitiesConfig.Title}</h3>";

            html += "<div class='entities-list'>";

            foreach (var entityId in entitiesConfig.Entities)
            {
                try
                {
                    var entity = entityStore.GetEntity(entityId);
                    var tapAction = entitiesConfig.TapAction ?? new Models.Action { ActionType = "toggle" };
                    
                    html += $@"
                        <div class='entity-item' data-entity-id='{entity.Id}' data-action='{tapAction.ActionType}'>
                            <span class='entity-icon'>{(entitiesConfig.Icon ?? "🔌")}</span>
                            <div class='entity-info'>
                                <span class='entity-name'>{entity.Name ?? entity.Id}</span>
                                <span class='entity-state'>{entity.State}</span>
                            </div>
                        </div>";
                }
                catch (KeyNotFoundException)
                {
                    html += $"<div class='entity-error'>Entity '{entityId}' not found</div>";
                }
            }

            html += "</div></div>";

            return new RenderedCard("entities", html)
            {
                Title = entitiesConfig.Title,
                Icon = entitiesConfig.Icon
            };
        }
    }
}
