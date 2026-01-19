using System;
using LovelaceCardEngine.Core.Models;
using LovelaceCardEngine.Core.Services;
using LovelaceCardEngine.Core.Rendering;

namespace LovelaceCardEngine.Core.Rendering.Renderers
{
    /// <summary>
    /// Renders gauge card
    /// </summary>
    public class GaugeCardRenderer : ICardRenderer
    {
        public bool CanRender(string cardType) => cardType == "gauge";

        public RenderedCard Render(CardConfig config, IEntityStore entityStore)
        {
            var gaugeConfig = config as GaugeCardConfig
                ?? throw new ArgumentException("Invalid gauge card config");

            var entity = gaugeConfig.Entity != null ? entityStore.GetEntity(gaugeConfig.Entity) : null;
            
            decimal value = 0;
            if (entity?.State != null && decimal.TryParse(entity.State.ToString(), out var val))
                value = val;

            // Calculate percentage for visual representation
            var percent = (double)((value - gaugeConfig.Min) / (gaugeConfig.Max - gaugeConfig.Min) * 100);
            percent = Math.Max(0, Math.Min(100, percent)); // Clamp 0-100

            var displayValue = gaugeConfig.Decimals.HasValue 
                ? value.ToString($"F{gaugeConfig.Decimals}")
                : value.ToString("F1");

            var html = $@"
                <div class='gauge-card' data-entity-id='{gaugeConfig.Entity}'>
                    <div class='gauge-title'>{gaugeConfig.Title ?? gaugeConfig.Entity}</div>
                    <div class='gauge-container'>
                        <div class='gauge-arc' style='width:{percent}%'></div>
                        <div class='gauge-value'>{displayValue} {gaugeConfig.Unit}</div>
                    </div>
                    <div class='gauge-range'>{gaugeConfig.Min} → {gaugeConfig.Max}</div>
                </div>";

            return new RenderedCard("gauge", html)
            {
                Title = gaugeConfig.Title,
                Icon = gaugeConfig.Icon
            };
        }
    }
}
