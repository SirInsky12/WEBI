using System;
using LovelaceCardEngine.Core.Models;
using LovelaceCardEngine.Core.Services;
using LovelaceCardEngine.Core.Rendering;

namespace LovelaceCardEngine.Core.Rendering.Renderers
{
    /// <summary>
    /// Renders stack layout card (vertical or horizontal)
    /// </summary>
    public class StackCardRenderer : ICardRenderer
    {
        private readonly CardRendererFactory _factory;

        public StackCardRenderer(CardRendererFactory factory)
        {
            _factory = factory;
        }

        public bool CanRender(string cardType) => cardType == "vertical-stack" || cardType == "horizontal-stack";

        public RenderedCard Render(CardConfig config, IEntityStore entityStore)
        {
            var stackConfig = config as StackCardConfig
                ?? throw new ArgumentException("Invalid stack card config");

            var direction = stackConfig.Direction == "horizontal" ? "row" : "column";
            var html = $"<div class='stack-card' style='display:flex;flex-direction:{direction};gap:16px'>";

            var rendered = new RenderedCard(stackConfig.Direction == "horizontal" ? "horizontal-stack" : "vertical-stack", html)
            {
                Title = stackConfig.Title,
                Icon = stackConfig.Icon,
                ChildCards = new(),
                LayoutDirection = stackConfig.Direction
            };

            foreach (var card in stackConfig.Cards)
            {
                var renderedChild = _factory.Render(card, entityStore);
                rendered.ChildCards.Add(renderedChild);
            }

            rendered.Content = html + string.Join("", rendered.ChildCards.Select(c => $"<div>{c.Content}</div>")) + "</div>";

            return rendered;
        }
    }
}
