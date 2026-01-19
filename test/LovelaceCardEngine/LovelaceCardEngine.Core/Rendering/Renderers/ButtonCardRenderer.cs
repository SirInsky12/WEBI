using System;
using LovelaceCardEngine.Core.Models;
using LovelaceCardEngine.Core.Services;
using LovelaceCardEngine.Core.Rendering;

namespace LovelaceCardEngine.Core.Rendering.Renderers
{
    /// <summary>
    /// Renders button card
    /// </summary>
    public class ButtonCardRenderer : ICardRenderer
    {
        public bool CanRender(string cardType) => cardType == "button";

        public RenderedCard Render(CardConfig config, IEntityStore entityStore)
        {
            var buttonConfig = config as ButtonCardConfig
                ?? throw new ArgumentException("Invalid button card config");

            var entity = buttonConfig.Entity != null ? entityStore.GetEntity(buttonConfig.Entity) : null;
            var isActive = entity?.State is true or "on";
            var stateClass = isActive ? "active" : "inactive";

            var html = $@"
                <div class='button-card {stateClass}' data-entity-id='{buttonConfig.Entity}' data-action='toggle'>
                    <div class='button-icon'>{buttonConfig.Icon ?? "🔘"}</div>
                    <div class='button-title'>{buttonConfig.Title ?? buttonConfig.Entity}</div>
                    <div class='button-state'>{(entity?.State ?? "unknown")}</div>
                </div>";

            return new RenderedCard("button", html)
            {
                Title = buttonConfig.Title,
                Icon = buttonConfig.Icon
            };
        }
    }
}
