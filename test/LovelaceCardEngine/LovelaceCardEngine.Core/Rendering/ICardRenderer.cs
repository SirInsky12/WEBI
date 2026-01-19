using System;
using LovelaceCardEngine.Core.Models;
using LovelaceCardEngine.Core.Services;
using LovelaceCardEngine.Core.Rendering.Renderers;

namespace LovelaceCardEngine.Core.Rendering
{
    /// <summary>
    /// Represents rendered card content
    /// </summary>
    public class RenderedCard
    {
        public string Type { get; set; }
        public string? Title { get; set; }
        public string? Icon { get; set; }
        public string Content { get; set; }
        public List<RenderedCard>? ChildCards { get; set; }
        public string? LayoutDirection { get; set; } // vertical, horizontal for stacks
        public int? GridColumns { get; set; }

        public RenderedCard(string type, string content)
        {
            Type = type;
            Content = content;
        }
    }

    /// <summary>
    /// Interface for card renderers
    /// </summary>
    public interface ICardRenderer
    {
        bool CanRender(string cardType);
        RenderedCard Render(CardConfig config, IEntityStore entityStore);
    }

    /// <summary>
    /// Factory for creating card renderers
    /// </summary>
    public class CardRendererFactory
    {
        private readonly List<ICardRenderer> _renderers = new();

        public CardRendererFactory()
        {
            // Register all card renderers
            _renderers.Add(new EntitiesCardRenderer());
            _renderers.Add(new ButtonCardRenderer());
            _renderers.Add(new GaugeCardRenderer());
            _renderers.Add(new MarkdownCardRenderer());
            _renderers.Add(new GridCardRenderer(this));
            _renderers.Add(new StackCardRenderer(this));
        }

        public RenderedCard Render(CardConfig config, IEntityStore entityStore)
        {
            var renderer = _renderers.FirstOrDefault(r => r.CanRender(config.Type));
            if (renderer == null)
                return new RenderedCard("unknown", $"Unknown card type: {config.Type}");

            return renderer.Render(config, entityStore);
        }
    }
}
